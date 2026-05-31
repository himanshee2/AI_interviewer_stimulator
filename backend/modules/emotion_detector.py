import cv2
import base64
import numpy as np
from deepface import DeepFace

def analyze_emotion_from_base64(image_base64):
    """Analyze emotion from a base64 encoded image"""
    
    try:
        # Decode base64 image
        image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return None, "Could not decode image"
        
        # Analyze with DeepFace
        result = DeepFace.analyze(
            frame,
            actions=['emotion'],
            enforce_detection=False,
            silent=True
        )
        
        if isinstance(result, list):
            result = result[0]
        
        emotions = result['emotion']
        dominant_emotion = result['dominant_emotion']
        
        # ✅ Convert float32 to normal float
        emotions_clean = {k: round(float(v), 1) for k, v in emotions.items()}
        
        confidence_score = calculate_confidence_from_emotion(emotions_clean)
        
        return {
            "dominant_emotion": str(dominant_emotion),
            "emotions": emotions_clean,
            "confidence_score": float(confidence_score),
            "feedback": generate_emotion_feedback(dominant_emotion, confidence_score)
        }, None
        
    except Exception as e:
        return None, str(e)


def calculate_confidence_from_emotion(emotions):
    score = 5.0
    score += emotions.get('happy', 0) * 0.03
    score += emotions.get('neutral', 0) * 0.02
    score -= emotions.get('fear', 0) * 0.04
    score -= emotions.get('sad', 0) * 0.03
    score -= emotions.get('angry', 0) * 0.02
    score -= emotions.get('disgust', 0) * 0.02
    return round(min(10, max(0, score)), 1)


def generate_emotion_feedback(dominant_emotion, confidence_score):
    feedback_map = {
        'happy': "Great! You appear confident and positive — excellent for interviews!",
        'neutral': "Good neutral expression — professional and composed.",
        'sad': "You seem a bit low — try to smile more and show enthusiasm!",
        'fear': "You appear nervous — take a deep breath and relax!",
        'angry': "Try to relax your facial expression — appear more calm.",
        'surprise': "You look surprised — try to maintain a composed expression.",
        'disgust': "Try to maintain a more positive facial expression."
    }
    return feedback_map.get(dominant_emotion, "Keep a confident and positive expression!")