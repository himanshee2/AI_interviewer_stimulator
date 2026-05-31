from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, Interview
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({"error": "All fields required"}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered!"}), 400
    
    hashed = generate_password_hash(password)
    user = User(name=name, email=email, password=hashed)
    db.session.add(user)
    db.session.commit()
    
    token = create_access_token(identity=str(user.id))
    
    return jsonify({
        "message": "Account created!",
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email}
    }), 201


@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401
    
    token = create_access_token(identity=str(user.id))
    
    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email}
    }), 200


@auth_bp.route('/api/save-interview', methods=['POST'])
@jwt_required()
def save_interview():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    interview = Interview(
        user_id=user_id,
        role=data.get('role'),
        difficulty=data.get('difficulty'),
        overall_score=data.get('overall_score'),
        emotion_score=data.get('emotion_score'),
        voice_score=data.get('voice_score'),
        technical_score=data.get('technical_score'),
        communication_score=data.get('communication_score')
    )
    db.session.add(interview)
    db.session.commit()
    
    return jsonify({"message": "Interview saved!"}), 201


@auth_bp.route('/api/my-interviews', methods=['GET'])
@jwt_required()
def my_interviews():
    user_id = get_jwt_identity()
    interviews = Interview.query.filter_by(user_id=user_id).order_by(Interview.created_at.desc()).all()
    
    return jsonify({
        "interviews": [{
            "id": i.id,
            "role": i.role,
            "difficulty": i.difficulty,
            "overall_score": i.overall_score,
            "emotion_score": i.emotion_score,
            "voice_score": i.voice_score,
            "created_at": i.created_at.strftime('%d %b %Y %I:%M %p')
        } for i in interviews]
    }), 200


@auth_bp.route('/api/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify({"user": {"id": user.id, "name": user.name, "email": user.email}}), 200

@auth_bp.route('/api/my-stats', methods=['GET'])
@jwt_required()
def my_stats():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    interviews = Interview.query.filter_by(user_id=user_id).order_by(Interview.created_at.desc()).all()
    
    total = len(interviews)
    avg_score = round(sum(i.overall_score or 0 for i in interviews) / total, 1) if total > 0 else 0
    best_score = max((i.overall_score or 0 for i in interviews), default=0)
    
    return jsonify({
        "user": {"id": user.id, "name": user.name, "email": user.email, "joined": user.created_at.strftime('%d %b %Y')},
        "stats": {
            "total_interviews": total,
            "avg_score": avg_score,
            "best_score": best_score,
            "roles_practiced": list(set(i.role for i in interviews if i.role))
        },
        "history": [{
            "id": i.id,
            "role": i.role,
            "difficulty": i.difficulty,
            "overall_score": i.overall_score,
            "emotion_score": i.emotion_score,
            "voice_score": i.voice_score,
            "technical_score": i.technical_score,
            "communication_score": i.communication_score,
            "date": i.created_at.strftime('%d %b %Y, %I:%M %p')
        } for i in interviews]
    }), 200