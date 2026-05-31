from groq import Groq
import os
import json

def generate_questions(resume_text, role, difficulty, num_questions=6):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    prompt = f"""
You are an expert HR interviewer.

Based on this resume, generate {num_questions} interview questions for {role} at {difficulty} difficulty.

Resume:
{resume_text}

Generate EXACTLY this mix:
- 2 Technical questions (based on their skills/projects) — type: "technical"
- 2 HR/Behavioral questions — type: "behavioral"  
- 1 Role-specific question — type: "technical"
- 1 Voice-only question (a situational or opinion-based question that requires spoken explanation) — type: "voice_only"

For voice_only question: ask something like "Describe a challenging situation you faced and how you handled it" or "In your own words, why do you want this role?"

Return ONLY a JSON array like this, nothing else:
[
  {{"id": 1, "type": "technical", "question": "..."}},
  {{"id": 2, "type": "behavioral", "question": "..."}},
  {{"id": 3, "type": "voice_only", "question": "...", "voice_instruction": "Please record your answer using the microphone below."}}
]
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )

    text = response.choices[0].message.content.strip()

    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    questions = json.loads(text.strip())
    return questions, None