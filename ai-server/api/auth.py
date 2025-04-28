from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from core.database import get_db_connection

# Konfiguracja JWT
JWT_SECRET = os.getenv("JWT_SECRET", "supersekretnyklucz")
JWT_ALGORITHM = "HS256"
JWT_EXP_DELTA_MINUTES = 60  # Token ważny przez 60 minut

router = APIRouter()

class RegistrationInput(BaseModel):
    username: str
    email: str
    password: str

class LoginInput(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/register", tags=["Authentication"])
async def register(data: RegistrationInput):
    try:
        # Hashowanie hasła
        hashed_password = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        # Zakładamy, że nowy użytkownik ma domyślną rolę "user"
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, email, password, role) VALUES (%s, %s, %s, %s)",
            (data.username, data.email, hashed_password, "user")
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "message": "User registered successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=Token, tags=["Authentication"])
async def login(data: LoginInput):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, username, password FROM users WHERE username = %s", (data.username,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        user_id, username, hashed_password = user
        if not bcrypt.checkpw(data.password.encode('utf-8'), hashed_password.encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        payload = {
            "user_id": user_id,
            "username": username,
            "exp": datetime.utcnow() + timedelta(minutes=JWT_EXP_DELTA_MINUTES)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Funkcja pomocnicza do weryfikacji tokenu
def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# Dodana funkcja: sprawdzenie, czy bieżący użytkownik jest administratorem
def get_current_admin(current_user=Depends(get_current_user)):
    """
    Verify if the current user has admin privileges
    """
    # Get user role from database based on user_id from token
    try:
        user_id = current_user["user_id"]
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
        user_role = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user_role or user_role[0] != "admin":
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions. Admin role required."
            )
        return current_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
