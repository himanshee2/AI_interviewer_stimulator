import PyPDF2
import os

def extract_text_from_pdf(file_path):
    """Extract all text from a PDF resume"""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        return None, str(e)
    
    return text.strip(), None