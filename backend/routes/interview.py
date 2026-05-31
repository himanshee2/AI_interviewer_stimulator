from flask import Blueprint, request, jsonify
import os
from modules.resume_parser import extract_text_from_pdf
from modules.question_generator import generate_questions

interview_bp = Blueprint('interview', __name__)

@interview_bp.route('/api/upload-resume', methods=['POST'])
def upload_resume():
    """Upload a PDF resume and get AI-generated questions"""
    
    # Check if file was sent
    if 'resume' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['resume']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not file.filename.endswith('.pdf'):
        return jsonify({"error": "Only PDF files allowed"}), 400
    
    # Get form data
    role = request.form.get('role', 'Software Engineer')
    difficulty = request.form.get('difficulty', 'Medium')
    
    # Save the file
    upload_folder = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    file_path = os.path.join(upload_folder, file.filename)
    file.save(file_path)
    
    # Extract text from PDF
    resume_text, error = extract_text_from_pdf(file_path)
    if error:
        return jsonify({"error": f"Could not read PDF: {error}"}), 500
    
    # Generate questions using Claude AI
    questions, error = generate_questions(resume_text, role, difficulty)
    if error:
        return jsonify({"error": f"Could not generate questions: {error}"}), 500
    
    return jsonify({
        "message": "Resume uploaded successfully!",
        "role": role,
        "difficulty": difficulty,
        "questions": questions
    }), 200

@interview_bp.route('/api/evaluate-answer', methods=['POST'])
def evaluate_answer_route():
    """Evaluate a candidate's interview answer"""
    
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data sent"}), 400
    
    question = data.get('question')
    answer = data.get('answer')
    role = data.get('role', 'Software Engineer')
    
    if not question or not answer:
        return jsonify({"error": "Question and answer are required"}), 400
    
    from modules.answer_evaluator import evaluate_answer
    result, error = evaluate_answer(question, answer, role)
    
    if error:
        return jsonify({"error": error}), 500
    
    return jsonify({
        "question": question,
        "your_answer": answer,
        "evaluation": result
    }), 200

@interview_bp.route('/api/analyze-voice', methods=['POST'])
def analyze_voice_route():
    """Analyze uploaded audio file"""
    
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400
    
    file = request.files['audio']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Save audio file
    upload_folder = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    file_path = os.path.join(upload_folder, file.filename)
    file.save(file_path)
    
    from modules.voice_analyzer import analyze_voice
    result, error = analyze_voice(file_path)
    
    if error:
        return jsonify({"error": error}), 500
    
    return jsonify({
        "message": "Voice analyzed successfully!",
        "analysis": result
    }), 200

@interview_bp.route('/api/analyze-emotion', methods=['POST'])
def analyze_emotion_route():
    """Analyze emotion from webcam image"""
    
    data = request.get_json()
    
    if not data or 'image' not in data:
        return jsonify({"error": "No image data received"}), 400
    
    from modules.emotion_detector import analyze_emotion_from_base64
    result, error = analyze_emotion_from_base64(data['image'])
    
    if error:
        return jsonify({"error": error}), 500
    
    return jsonify({
        "message": "Emotion analyzed!",
        "analysis": result
    }), 200

@interview_bp.route('/api/generate-report', methods=['POST'])
def generate_report_route():
    """Generate PDF interview report"""
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    from modules.report_generator import generate_report
    import time
    
    # Save report in uploads folder
    upload_folder = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    filename = f"interview_report_{int(time.time())}.pdf"
    output_path = os.path.join(upload_folder, filename)
    
    report_path = generate_report(data, output_path)
    
    from flask import send_file
    return send_file(
        report_path,
        as_attachment=True,
        download_name="Interview_Report.pdf",
        mimetype='application/pdf'
    )