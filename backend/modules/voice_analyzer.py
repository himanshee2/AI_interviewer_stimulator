import librosa
import numpy as np
import speech_recognition as sr
from pydub import AudioSegment
import os
import tempfile

def analyze_voice(audio_file_path):
    """Analyze voice confidence, speed, and energy from audio file"""
    
    try:
        # Convert to wav if needed
        wav_path = convert_to_wav(audio_file_path)
        
        # Load audio with librosa
        y, sr_rate = librosa.load(wav_path, sr=None)
        
        # 1. Energy / Confidence Score
        rms_energy = librosa.feature.rms(y=y)[0]
        avg_energy = float(np.mean(rms_energy))
        energy_score = min(10, round(avg_energy * 500, 1))
        
        # 2. Speaking Rate (zero crossing rate = activity)
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        avg_zcr = float(np.mean(zcr))
        
        # 3. Pauses Detection
        silence_threshold = 0.01
        is_silence = rms_energy < silence_threshold
        pause_count = int(np.sum(np.diff(is_silence.astype(int)) > 0))
        
        # 4. Pitch Analysis
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr_rate)
        pitch_values = pitches[magnitudes > np.median(magnitudes)]
        avg_pitch = float(np.mean(pitch_values)) if len(pitch_values) > 0 else 0
        
        # 5. Duration
        duration = librosa.get_duration(y=y, sr=sr_rate)
        
        # 6. Speech Recognition - get transcript
        transcript = get_transcript(wav_path)
        
        # 7. Speaking speed (words per minute)
        word_count = len(transcript.split()) if transcript else 0
        wpm = round((word_count / duration) * 60) if duration > 0 else 0
        
        # Calculate confidence score
        confidence_score = calculate_confidence(avg_energy, pause_count, wpm)
        
        # Cleanup temp file
        if wav_path != audio_file_path:
            os.remove(wav_path)
        
        return {
            "transcript": transcript,
            "duration_seconds": round(duration, 1),
            "words_per_minute": wpm,
            "pause_count": pause_count,
            "confidence_score": confidence_score,
            "energy_level": round(avg_energy * 1000, 2),
            "feedback": generate_voice_feedback(confidence_score, wpm, pause_count)
        }, None

    except Exception as e:
        return None, str(e)


def convert_to_wav(file_path):
    """Convert audio to WAV format"""
    if file_path.endswith('.wav'):
        return file_path
    
    audio = AudioSegment.from_file(file_path)
    temp_wav = tempfile.mktemp(suffix='.wav')
    audio.export(temp_wav, format='wav')
    return temp_wav


def get_transcript(wav_path):
    """Convert speech to text"""
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            return text
    except:
        return ""


def calculate_confidence(energy, pauses, wpm):
    """Calculate overall confidence score 0-10"""
    score = 5.0
    
    # Energy contribution
    if energy > 0.05:
        score += 2
    elif energy > 0.02:
        score += 1
    
    # Speaking speed (ideal: 120-160 wpm)
    if 120 <= wpm <= 160:
        score += 2
    elif 100 <= wpm <= 180:
        score += 1
    elif wpm < 80 or wpm > 200:
        score -= 1
    
    # Pauses (too many = nervous)
    if pauses > 10:
        score -= 1
    elif pauses < 3:
        score += 1
    
    return round(min(10, max(0, score)), 1)


def generate_voice_feedback(confidence, wpm, pauses):
    """Generate human-readable feedback"""
    feedback = []
    
    if confidence >= 8:
        feedback.append("Excellent voice confidence!")
    elif confidence >= 6:
        feedback.append("Good confidence level.")
    else:
        feedback.append("Work on speaking more confidently.")
    
    if wpm < 100:
        feedback.append("You're speaking too slowly — try to pick up the pace.")
    elif wpm > 180:
        feedback.append("You're speaking too fast — slow down a bit.")
    else:
        feedback.append("Good speaking pace!")
    
    if pauses > 10:
        feedback.append("Too many pauses — practice to reduce filler pauses.")
    else:
        feedback.append("Good flow with minimal pauses.")
    
    return " ".join(feedback)