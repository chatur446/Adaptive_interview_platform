📌 Adaptive Interview Platform

An AI-powered adaptive interview platform that simulates real interviews using Flask, SQLAlchemy, WebSockets, and LLMs/GANs. The platform dynamically generates interview questions, evaluates responses, and provides both verbal and non-verbal feedback.

🚀 Features

🎯 Adaptive Questioning – Questions adjust based on candidate performance.

🧠 AI-Powered Feedback – Uses LLMs for answer evaluation and personalized suggestions.

👀 Facial Expression Analysis – GANs + Computer Vision track confidence & emotions.

📡 Real-Time Interviews – WebSocket-based video/audio streaming.

📊 Performance Dashboard – Visual analytics on strengths & weaknesses.

🔒 Secure Backend – Session handling & database with SQLAlchemy.

🛠️ Tech Stack

Backend:

Python, Flask, SQLAlchemy

WebSockets (real-time communication)

Frontend:

HTML, CSS, python

AI Components:

LLMs (Google Gemini / GPT) for question generation & feedback

GANs for realistic behavioral analysis

⚡ Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/<your-username>/adaptive-interview-platform.git
cd adaptive-interview-platform

2️⃣ Create Virtual Environment
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

3️⃣ Install Dependencies
pip install -r requirements.txt

4️⃣ Set Environment Variables

Create a .env file in the root:

FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///interview.db

5️⃣ Run the Application
flask
python main.py

Visit: http://127.0.0.1:5000/

Database:

SQLAlchemy ORM (SQLite/Postgres/MySQL supported)
