from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import secrets
import string
from datetime import datetime

from core.database import get_db
from core.db_manager import get_db_connection

from core.models import InvitationCreate, InvitationResponse, UserCreate, Invitation
from utils.logger import logger
from api.auth import get_current_admin  # Zakładając, że masz funkcję do pobierania admina z tokenu

router = APIRouter()

def generate_invitation_code(length=16) -> str:
    """Generuje unikalny kod zaproszenia"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

@router.post("/invitations/generate", response_model=InvitationResponse, tags=["Invitations"])
async def generate_invitation(count: int = 1, admin_id: int = Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    Generuje określoną liczbę kodów zaproszenia (tylko dla administratorów)
    """
    if count > 50:  # Limit zaproszeń
        raise HTTPException(status_code=400, detail="Maksymalna liczba zaproszeń to 50")
    
    invitations = []
    for _ in range(count):
        code = generate_invitation_code()
        new_invitation = Invitation(
            invitation_code=code,
            created_by=admin_id,
            is_used=False
        )
        db.add(new_invitation)
        invitations.append(new_invitation)
    
    db.commit()
    return {"invitations": invitations}

@router.post("/register/with-invitation", tags=["Authentication"])
async def register_with_invitation(user_data: UserCreate, invitation_code: str, db: Session = Depends(get_db)):
    """
    Rejestruje nowego użytkownika z kodem zaproszenia
    """
    # Sprawdź, czy kod zaproszenia istnieje i nie był użyty
    invitation = db.query(Invitation).filter(
        Invitation.invitation_code == invitation_code,
        Invitation.is_used == False
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nieprawidłowy lub wykorzystany kod zaproszenia"
        )
    
    # Utwórz użytkownika
    try:
        new_user = UserCreate(
            email=user_data.email,
            password=user_data.password,
            first_name=user_data.first_name,
            last_name=user_data.last_name
        )
        
        # Oznacz zaproszenie jako wykorzystane
        invitation.is_used = True
        invitation.used_at = datetime.utcnow()
        invitation.email = user_data.email
        
        db.commit()
        return {"message": "Użytkownik został pomyślnie zarejestrowany"}
    except Exception as e:
        db.rollback()
        logger.error(f"Błąd rejestracji użytkownika: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Wystąpił błąd podczas rejestracji"
        )
