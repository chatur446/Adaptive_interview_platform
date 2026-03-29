import os
import json
import logging
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import List, Dict, Any

# Initialize Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", "default_key"))

class QuestionResponse(BaseModel):
    questions: List[Dict[str, str]]

class AnalysisResponse(BaseModel):
    technical_accuracy: float
    communication_score: float
    confidence_score: float
    feedback: str
    improvement_suggestions: str

class InterviewAnalysisResponse(BaseModel):
    overall_performance: float
    technical_skills_score: float
    communication_skills_score: float
    confidence_level: float
    strengths: str
    areas_for_improvement: str
    detailed_feedback: str

def generate_interview_questions(interview_type: str, difficulty: str = "medium", count: int = 5) -> List[Dict[str, Any]]:
    """Generate interview questions using Gemini API"""
    try:
        if interview_type == "technical":
            system_prompt = (
                f"You are an expert technical interviewer. Generate {count} unique {difficulty} level "
                "technical interview questions covering programming, algorithms, system design, and problem-solving. "
                "Each question should be distinct and test different aspects of technical knowledge. "
                "Respond with JSON in this format: "
                "{'questions': [{'question': 'question text', 'type': 'technical', 'difficulty': 'level', 'category': 'programming/algorithms/system_design'}]}"
            )
        else:
            system_prompt = (
                f"You are an expert HR interviewer. Generate {count} unique {difficulty} level "
                "non-technical interview questions covering behavioral, situational, and soft skills assessment. "
                "Each question should be distinct and test different aspects of professional competency. "
                "Respond with JSON in this format: "
                "{'questions': [{'question': 'question text', 'type': 'non-technical', 'difficulty': 'level', 'category': 'behavioral/situational/leadership'}]}"
            )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[types.Content(role="user", parts=[types.Part(text=system_prompt)])],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=QuestionResponse,
            ),
        )

        if response.text:
            data = json.loads(response.text)
            return data.get('questions', [])
        else:
            raise ValueError("Empty response from Gemini API")

    except Exception as e:
        logging.error(f"Error generating questions: {e}")
        return generate_fallback_questions(interview_type, difficulty, count)

def analyze_user_response(question: str, user_answer: str, question_type: str) -> Dict[str, Any]:
    """Analyze user's response using Gemini API"""
    try:
        system_prompt = (
            f"You are an expert interview assessor. Analyze this interview response:\n\n"
            f"Question: {question}\n"
            f"Answer: {user_answer}\n"
            f"Question Type: {question_type}\n\n"
            "Provide scores (0-10) for technical accuracy, communication skills, and confidence. "
            "Also provide detailed feedback and specific improvement suggestions. "
            "Respond with JSON in this format: "
            "{'technical_accuracy': float, 'communication_score': float, 'confidence_score': float, "
            "'feedback': 'detailed feedback', 'improvement_suggestions': 'specific suggestions'}"
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[types.Content(role="user", parts=[types.Part(text=system_prompt)])],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalysisResponse,
            ),
        )

        if response.text:
            data = json.loads(response.text)
            return {
                'technical_accuracy': data.get('technical_accuracy', 5.0) / 10.0,  # Convert to 0-1 scale
                'communication_score': data.get('communication_score', 5.0) / 10.0,
                'confidence_score': data.get('confidence_score', 5.0) / 10.0,
                'feedback': data.get('feedback', 'No feedback available'),
                'improvement_suggestions': data.get('improvement_suggestions', 'No suggestions available')
            }
        else:
            raise ValueError("Empty response from Gemini API")

    except Exception as e:
        logging.error(f"Error analyzing response: {e}")
        return {
            'technical_accuracy': 0.5,
            'communication_score': 0.5,
            'confidence_score': 0.5,
            'feedback': 'Analysis temporarily unavailable',
            'improvement_suggestions': 'Please try again later'
        }

def generate_interview_analytics(questions_data: List[Dict], face_analysis_data: List[Dict]) -> Dict[str, Any]:
    """Generate comprehensive interview analytics using Gemini API"""
    try:
        analytics_prompt = (
            "You are an expert interview analyst. Based on the following interview data, "
            "provide comprehensive analytics and insights:\n\n"
            f"Questions and Responses: {json.dumps(questions_data, indent=2)}\n"
            f"Face Analysis Data: {json.dumps(face_analysis_data, indent=2)}\n\n"
            "Analyze overall performance, technical skills, communication skills, confidence level. "
            "Identify strengths, areas for improvement, and provide detailed feedback. "
            "Scores should be between 0-10. "
            "Respond with JSON in this format: "
            "{'overall_performance': float, 'technical_skills_score': float, 'communication_skills_score': float, "
            "'confidence_level': float, 'strengths': 'text', 'areas_for_improvement': 'text', 'detailed_feedback': 'text'}"
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[types.Content(role="user", parts=[types.Part(text=analytics_prompt)])],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=InterviewAnalysisResponse,
            ),
        )

        if response.text:
            data = json.loads(response.text)
            return {
                'overall_performance': data.get('overall_performance', 5.0) / 10.0,
                'technical_skills_score': data.get('technical_skills_score', 5.0) / 10.0,
                'communication_skills_score': data.get('communication_skills_score', 5.0) / 10.0,
                'confidence_level': data.get('confidence_level', 5.0) / 10.0,
                'strengths': data.get('strengths', 'Analysis pending'),
                'areas_for_improvement': data.get('areas_for_improvement', 'Analysis pending'),
                'detailed_feedback': data.get('detailed_feedback', 'Analysis pending')
            }
        else:
            raise ValueError("Empty response from Gemini API")

    except Exception as e:
        logging.error(f"Error generating analytics: {e}")
        return {
            'overall_performance': 0.5,
            'technical_skills_score': 0.5,
            'communication_skills_score': 0.5,
            'confidence_level': 0.5,
            'strengths': 'Analytics temporarily unavailable',
            'areas_for_improvement': 'Please try again later',
            'detailed_feedback': 'Detailed analysis will be available shortly'
        }

def generate_fallback_questions(interview_type: str, difficulty: str, count: int) -> List[Dict[str, Any]]:
    """Fallback questions when Gemini API is unavailable"""
    if interview_type == "technical":
        return [
            {
                "question": "Explain the difference between stack and queue data structures.",
                "type": "technical",
                "difficulty": difficulty,
                "category": "algorithms"
            },
            {
                "question": "What is the time complexity of binary search and why?",
                "type": "technical", 
                "difficulty": difficulty,
                "category": "algorithms"
            },
            {
                "question": "Describe the principles of object-oriented programming.",
                "type": "technical",
                "difficulty": difficulty,
                "category": "programming"
            },
            {
                "question": "How would you design a URL shortening service like bit.ly?",
                "type": "technical",
                "difficulty": difficulty,
                "category": "system_design"
            },
            {
                "question": "Explain the concept of database normalization.",
                "type": "technical",
                "difficulty": difficulty,
                "category": "database"
            }
        ][:count]
    else:
        return [
            {
                "question": "Tell me about a time you had to work under pressure.",
                "type": "non-technical",
                "difficulty": difficulty,
                "category": "behavioral"
            },
            {
                "question": "How do you handle conflicts with team members?",
                "type": "non-technical",
                "difficulty": difficulty,
                "category": "situational"
            },
            {
                "question": "What motivates you in your work?",
                "type": "non-technical",
                "difficulty": difficulty,
                "category": "behavioral"
            },
            {
                "question": "Describe your leadership style.",
                "type": "non-technical",
                "difficulty": difficulty,
                "category": "leadership"
            },
            {
                "question": "How do you prioritize tasks when everything seems urgent?",
                "type": "non-technical",
                "difficulty": difficulty,
                "category": "situational"
            }
        ][:count]
