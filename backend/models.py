from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    interviews = db.relationship('Interview', backref='user', lazy=True)

class Interview(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(100))
    difficulty = db.Column(db.String(50))
    overall_score = db.Column(db.Float)
    emotion_score = db.Column(db.Float)
    voice_score = db.Column(db.Float)
    technical_score = db.Column(db.Float)
    communication_score = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)