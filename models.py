from datetime import datetime
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    interviews = db.relationship('Interview', backref='user', lazy=True, cascade='all, delete-orphan')
    analytics = db.relationship('Analytics', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Interview(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    interview_type = db.Column(db.String(50), nullable=False)  # 'technical' or 'non-technical'
    status = db.Column(db.String(20), default='in_progress')  # 'in_progress', 'completed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    total_questions = db.Column(db.Integer, default=0)
    questions_answered = db.Column(db.Integer, default=0)
    overall_score = db.Column(db.Float)
    
    # Relationships
    questions = db.relationship('Question', backref='interview', lazy=True, cascade='all, delete-orphan')
    analytics = db.relationship('Analytics', backref='interview', lazy=True, cascade='all, delete-orphan')

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey('interview.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False)
    difficulty_level = db.Column(db.String(20), nullable=False)  # 'easy', 'medium', 'hard'
    user_answer = db.Column(db.Text)
    audio_file_path = db.Column(db.String(255))
    response_time = db.Column(db.Float)  # in seconds
    confidence_score = db.Column(db.Float)
    technical_accuracy = db.Column(db.Float)
    communication_score = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    answered_at = db.Column(db.DateTime)
    
    # AI Analysis
    ai_feedback = db.Column(db.Text)
    improvement_suggestions = db.Column(db.Text)

class Analytics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    interview_id = db.Column(db.Integer, db.ForeignKey('interview.id'), nullable=False)
    
    # Performance Metrics
    overall_performance = db.Column(db.Float)
    technical_skills_score = db.Column(db.Float)
    communication_skills_score = db.Column(db.Float)
    confidence_level = db.Column(db.Float)
    
    # Face Analysis Metrics
    eye_contact_percentage = db.Column(db.Float)
    facial_expression_score = db.Column(db.Float)
    posture_score = db.Column(db.Float)
    nervousness_indicators = db.Column(db.Float)
    
    # Speech Analysis
    speech_clarity = db.Column(db.Float)
    speech_pace = db.Column(db.Float)
    filler_words_count = db.Column(db.Integer)
    
    # Time Analytics
    average_response_time = db.Column(db.Float)
    total_interview_duration = db.Column(db.Float)
    
    # Improvement Areas
    strengths = db.Column(db.Text)
    areas_for_improvement = db.Column(db.Text)
    detailed_feedback = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FaceAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey('interview.id'), nullable=False)
    timestamp = db.Column(db.Float, nullable=False)  # timestamp in interview
    
    # Emotion Detection
    happiness = db.Column(db.Float, default=0.0)
    confidence = db.Column(db.Float, default=0.0)
    nervousness = db.Column(db.Float, default=0.0)
    concentration = db.Column(db.Float, default=0.0)
    
    # Eye Contact
    looking_at_camera = db.Column(db.Boolean, default=False)
    
    # Head Position
    head_position_x = db.Column(db.Float, default=0.0)
    head_position_y = db.Column(db.Float, default=0.0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
