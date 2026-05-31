from groq import Groq
import os
import json

def evaluate_answer(question, answer, role):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    prompt = f"""
You are an expert interviewer evaluating a candidate's answer.

Role: {role}
Question: {question}
Candidate's Answer: {answer}

Evaluate and return ONLY this JSON, nothing else:
{{
    "scores": {{
        "relevance": 8,
        "technical_accuracy": 7,
        "communication": 9,
        "overall": 8
    }},
    "strengths": ["Clear explanation", "Good examples"],
    "weaknesses": ["Missing mention of time complexity"],
    "ideal_answer_summary": "What a perfect answer looks like",
    "improvement_tip": "One specific tip to improve"
}}
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

    result = json.loads(text.strip())
    return result, None