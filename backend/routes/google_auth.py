from flask import Blueprint, redirect, request
from models import db, User
from flask_jwt_extended import create_access_token
import os
import requests as http_requests
import urllib.parse

google_auth_bp = Blueprint('google_auth', __name__)

REDIRECT_URI = "http://127.0.0.1:5000/api/auth/google/callback"
SCOPE = "openid email profile"

@google_auth_bp.route("/api/auth/google")
def google_login():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    params = {
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPE,
        "access_type": "offline",
        "prompt": "consent"
    }
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return redirect(auth_url)

@google_auth_bp.route("/api/auth/google/callback")
def google_callback():
    try:
        code = request.args.get("code")
        if not code:
            return redirect("http://localhost:5173?error=no_code")

        token_response = http_requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "redirect_uri": REDIRECT_URI,
                "grant_type": "authorization_code"
            }
        )
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            print("Token error:", token_data)
            return redirect("http://localhost:5173?error=token_failed")

        userinfo_response = http_requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        userinfo = userinfo_response.json()
        email = userinfo.get("email")
        name = userinfo.get("name", email.split("@")[0])

        if not email:
            return redirect("http://localhost:5173?error=no_email")

        user = User.query.filter_by(email=email).first()
        if not user:
            user = User(name=name, email=email, password="google_oauth")
            db.session.add(user)
            db.session.commit()

        token = create_access_token(identity=str(user.id))
        return redirect(
            f"http://localhost:5173?token={token}&user_name={urllib.parse.quote(name)}&user_email={email}&user_id={user.id}"
        )

    except Exception as e:
        print(f"Google auth error: {e}")
        return redirect("http://localhost:5173?error=exception")

def google_login_complete():
    pass