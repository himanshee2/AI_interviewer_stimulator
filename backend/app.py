from flask import Flask, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from routes.interview import interview_bp
from routes.auth import auth_bp
from routes.google_auth import google_auth_bp
import os

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
app.config.from_object(Config)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///interview.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'jwt-secret-key-change-this-2024-secure'
app.config['SECRET_KEY'] = 'flask-super-secret-key-2024-interview-simulator-xyz'
CORS(app)
db.init_app(app)
JWTManager(app)

app.register_blueprint(interview_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(google_auth_bp)

with app.app_context():
    db.create_all()
    print("✅ Database ready!")
    # Preload DeepFace model on startup
def preload_deepface():
    try:
        import numpy as np
        from deepface import DeepFace
        dummy = np.zeros((48, 48, 3), dtype=np.uint8)
        DeepFace.analyze(dummy, actions=['emotion'], enforce_detection=False, silent=True)
        print("✅ DeepFace model preloaded!")
    except Exception as e:
        print(f"DeepFace preload: {e}")

with app.app_context():
    db.create_all()
    print("✅ Database ready!")
    #preload_deepface()

@app.route('/')
def index():
    test_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test.html')
    return send_file(test_path)

@app.route('/api/health', methods=['GET'])
def health():
    return {"status": "AI Interview Simulator is running 🚀"}, 200

@app.route('/api/auth/google/google/authorized')
def old_google_redirect():
    # Purane URL ko naye pe redirect karo
    from flask import request as req
    new_url = req.url.replace('/api/auth/google/google/authorized', '/api/auth/google/callback')
    return redirect(new_url)

if __name__ == '__main__':
    app.run(debug=True, port=5000)