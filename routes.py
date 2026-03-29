import os
import json
import logging
from datetime import datetime
from flask import render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from app import app, db
from models import User, Interview, Question, Analytics, FaceAnalysis
from gemini_service import generate_interview_questions, analyze_user_response, generate_interview_analytics
from gan_service import MockGANService

# Initialize GAN service
gan_service = MockGANService()

@app.route('/')
def index():
    """Landing page"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return render_template('register.html')
        
        # Create new user
        user = User()
        user.username = username
        user.email = email
        user.set_password(password)
        
        try:
            db.session.add(user)
            db.session.commit()
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            logging.error(f"Registration error: {e}")
            flash('Registration failed. Please try again.', 'error')
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    """User logout"""
    logout_user()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    """User dashboard"""
    # Get user's interview statistics
    total_interviews = Interview.query.filter_by(user_id=current_user.id).count()
    completed_interviews = Interview.query.filter_by(user_id=current_user.id, status='completed').count()
    
    # Get recent interviews
    recent_interviews = Interview.query.filter_by(user_id=current_user.id)\
        .order_by(Interview.created_at.desc()).limit(5).all()
    
    # Calculate average performance
    analytics = Analytics.query.filter_by(user_id=current_user.id).all()
    avg_performance = sum(a.overall_performance for a in analytics) / len(analytics) if analytics else 0
    
    return render_template('dashboard.html',
                         total_interviews=total_interviews,
                         completed_interviews=completed_interviews,
                         recent_interviews=recent_interviews,
                         avg_performance=avg_performance)

@app.route('/start_interview', methods=['GET', 'POST'])
@login_required
def start_interview():
    """Start a new interview"""
    if request.method == 'POST':
        interview_type = request.form['interview_type']
        difficulty = request.form.get('difficulty', 'medium')
        
        # Create new interview
        interview = Interview()
        interview.user_id = current_user.id
        interview.interview_type = interview_type
        interview.status = 'in_progress'
        
        try:
            db.session.add(interview)
            db.session.commit()
            
            # Generate questions using Gemini API
            base_questions = generate_interview_questions(interview_type, difficulty, 5)
            
            # Enhance with GAN diversity
            diverse_questions = gan_service.generate_diverse_questions(base_questions, diversity_factor=0.4)
            enhanced_questions = gan_service.enhance_question_quality(diverse_questions)
            
            # Save questions to database
            for q_data in enhanced_questions:
                question = Question()
                question.interview_id = interview.id
                question.question_text = q_data['question']
                question.question_type = q_data['type']
                question.difficulty_level = q_data['difficulty']
                db.session.add(question)
            
            interview.total_questions = len(enhanced_questions)
            db.session.commit()
            
            return redirect(url_for('interview_session', interview_id=interview.id))
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error starting interview: {e}")
            flash('Failed to start interview. Please try again.', 'error')
            return redirect(url_for('dashboard'))
    
    return render_template('dashboard.html')

@app.route('/interview/<int:interview_id>')
@login_required
def interview_session(interview_id):
    """Interview session page"""
    interview = Interview.query.get_or_404(interview_id)
    
    # Check if user owns this interview
    if interview.user_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('dashboard'))
    
    # Get current question
    current_question = Question.query.filter_by(interview_id=interview_id, answered_at=None).first()
    
    if not current_question:
        # No more questions, complete interview
        return redirect(url_for('complete_interview', interview_id=interview_id))
    
    # Get question progress
    answered_questions = Question.query.filter_by(interview_id=interview_id)\
        .filter(Question.answered_at.isnot(None)).count()
    
    progress = (answered_questions / interview.total_questions) * 100 if interview.total_questions > 0 else 0
    
    return render_template('interview.html',
                         interview=interview,
                         question=current_question,
                         progress=progress,
                         question_number=answered_questions + 1)

@app.route('/submit_answer', methods=['POST'])
@login_required
def submit_answer():
    """Submit answer for current question"""
    try:
        data = request.get_json()
        question_id = data.get('question_id')
        user_answer = data.get('answer', '')
        response_time = data.get('response_time', 0)
        audio_file_path = data.get('audio_file_path', '')
        
        question = Question.query.get_or_404(question_id)
        
        # Check if user owns this question
        if question.interview.user_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Analyze response using Gemini API
        analysis = analyze_user_response(
            question.question_text,
            user_answer,
            question.question_type
        )
        
        # Update question with answer and analysis
        question.user_answer = user_answer
        question.response_time = response_time
        question.audio_file_path = audio_file_path
        question.answered_at = datetime.utcnow()
        question.confidence_score = analysis['confidence_score']
        question.technical_accuracy = analysis['technical_accuracy']
        question.communication_score = analysis['communication_score']
        question.ai_feedback = analysis['feedback']
        question.improvement_suggestions = analysis['improvement_suggestions']
        
        # Update interview progress
        interview = question.interview
        interview.questions_answered += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'questions_remaining': interview.total_questions - interview.questions_answered
        })
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error submitting answer: {e}")
        return jsonify({'error': 'Failed to submit answer'}), 500

@app.route('/save_face_analysis', methods=['POST'])
@login_required
def save_face_analysis():
    """Save face analysis data"""
    try:
        data = request.get_json()
        interview_id = data.get('interview_id')
        timestamp = data.get('timestamp', 0)
        analysis_data = data.get('analysis', {})
        
        interview = Interview.query.get_or_404(interview_id)
        
        # Check if user owns this interview
        if interview.user_id != current_user.id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Save face analysis
        face_analysis = FaceAnalysis()
        face_analysis.interview_id = interview_id
        face_analysis.timestamp = timestamp
        face_analysis.happiness = analysis_data.get('happiness', 0.0)
        face_analysis.confidence = analysis_data.get('confidence', 0.0)
        face_analysis.nervousness = analysis_data.get('nervousness', 0.0)
        face_analysis.concentration = analysis_data.get('concentration', 0.0)
        face_analysis.looking_at_camera = analysis_data.get('looking_at_camera', False)
        face_analysis.head_position_x = analysis_data.get('head_position_x', 0.0)
        face_analysis.head_position_y = analysis_data.get('head_position_y', 0.0)
        
        db.session.add(face_analysis)
        db.session.commit()
        
        return jsonify({'success': True})
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error saving face analysis: {e}")
        return jsonify({'error': 'Failed to save face analysis'}), 500

@app.route('/complete_interview/<int:interview_id>')
@login_required
def complete_interview(interview_id):
    """Complete interview and generate analytics"""
    interview = Interview.query.get_or_404(interview_id)
    
    # Check if user owns this interview
    if interview.user_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('dashboard'))
    
    try:
        # Mark interview as completed
        interview.status = 'completed'
        interview.completed_at = datetime.utcnow()
        
        # Get questions and face analysis data
        questions = Question.query.filter_by(interview_id=interview_id).all()
        face_analysis_data = FaceAnalysis.query.filter_by(interview_id=interview_id).all()
        
        # Prepare data for analytics generation
        questions_data = []
        for q in questions:
            questions_data.append({
                'question': q.question_text,
                'answer': q.user_answer,
                'response_time': q.response_time,
                'confidence_score': q.confidence_score,
                'technical_accuracy': q.technical_accuracy,
                'communication_score': q.communication_score
            })
        
        face_data = []
        for f in face_analysis_data:
            face_data.append({
                'timestamp': f.timestamp,
                'happiness': f.happiness,
                'confidence': f.confidence,
                'nervousness': f.nervousness,
                'concentration': f.concentration,
                'looking_at_camera': f.looking_at_camera
            })
        
        # Generate comprehensive analytics using Gemini API
        analytics_result = generate_interview_analytics(questions_data, face_data)
        
        # Calculate additional metrics
        total_response_time = sum(q.response_time for q in questions if q.response_time)
        avg_response_time = total_response_time / len(questions) if questions else 0
        
        # Calculate face analysis metrics
        if face_analysis_data:
            eye_contact_percentage = sum(1 for f in face_analysis_data if f.looking_at_camera) / len(face_analysis_data)
            avg_nervousness = sum(f.nervousness for f in face_analysis_data) / len(face_analysis_data)
            avg_confidence = sum(f.confidence for f in face_analysis_data) / len(face_analysis_data)
        else:
            eye_contact_percentage = 0.5
            avg_nervousness = 0.3
            avg_confidence = 0.6
        
        # Create analytics record
        analytics = Analytics()
        analytics.user_id = current_user.id
        analytics.interview_id = interview_id
        analytics.overall_performance = analytics_result['overall_performance']
        analytics.technical_skills_score = analytics_result['technical_skills_score']
        analytics.communication_skills_score = analytics_result['communication_skills_score']
        analytics.confidence_level = analytics_result['confidence_level']
        analytics.eye_contact_percentage = eye_contact_percentage
        analytics.facial_expression_score = avg_confidence
        analytics.nervousness_indicators = avg_nervousness
        analytics.average_response_time = avg_response_time
        analytics.total_interview_duration = total_response_time
        analytics.strengths = analytics_result['strengths']
        analytics.areas_for_improvement = analytics_result['areas_for_improvement']
        analytics.detailed_feedback = analytics_result['detailed_feedback']
        
        # Calculate overall score for interview
        interview.overall_score = analytics_result['overall_performance']
        
        db.session.add(analytics)
        db.session.commit()
        
        flash('Interview completed successfully!', 'success')
        return redirect(url_for('view_analytics', interview_id=interview_id))
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error completing interview: {e}")
        flash('Error completing interview. Please try again.', 'error')
        return redirect(url_for('dashboard'))

@app.route('/analytics/<int:interview_id>')
@login_required
def view_analytics(interview_id):
    """View interview analytics"""
    interview = Interview.query.get_or_404(interview_id)
    
    # Check if user owns this interview
    if interview.user_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('dashboard'))
    
    analytics = Analytics.query.filter_by(interview_id=interview_id).first()
    if not analytics:
        flash('Analytics not available for this interview.', 'error')
        return redirect(url_for('dashboard'))
    
    # Get questions for detailed review
    questions = Question.query.filter_by(interview_id=interview_id).all()
    
    # Get face analysis data for visualization
    face_analysis = FaceAnalysis.query.filter_by(interview_id=interview_id).all()
    
    return render_template('analytics.html',
                         interview=interview,
                         analytics=analytics,
                         questions=questions,
                         face_analysis=face_analysis)

@app.route('/analytics')
@login_required
def analytics_history():
    """View all analytics history"""
    user_analytics = Analytics.query.filter_by(user_id=current_user.id)\
        .join(Interview).order_by(Interview.created_at.desc()).all()
    
    return render_template('analytics.html', analytics_list=user_analytics)

@app.route('/profile')
@login_required
def profile():
    """User profile page"""
    # Get user statistics
    total_interviews = Interview.query.filter_by(user_id=current_user.id).count()
    completed_interviews = Interview.query.filter_by(user_id=current_user.id, status='completed').count()
    
    # Get performance trends
    analytics = Analytics.query.filter_by(user_id=current_user.id)\
        .join(Interview).order_by(Interview.created_at.asc()).all()
    
    performance_trend = [a.overall_performance for a in analytics]
    
    return render_template('profile.html',
                         user=current_user,
                         total_interviews=total_interviews,
                         completed_interviews=completed_interviews,
                         performance_trend=performance_trend)

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500
