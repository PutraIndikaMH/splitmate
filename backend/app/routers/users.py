from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.schemas.user import UserResponse, UserUpdate, PasswordChange, NotificationPreferences
from app.models.user import User
from app.dependencies import get_current_user, get_db
from app.services.activities import get_my_activities, get_my_notifications
from app.services.users import get_financial_score
from app.core.security import verify_password, hash_password

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.name = payload.name
    db.commit()
    db.refresh(current_user)
    return current_user

@router.patch("/me/password")
def change_password(payload: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password lama salah")
    
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password berhasil diubah"}

@router.get("/me/notifications/preferences", response_model=NotificationPreferences)
def get_notification_preferences(current_user: User = Depends(get_current_user)):
    return NotificationPreferences(
        notif_new_expense=current_user.notif_new_expense,
        notif_debt_reminder=current_user.notif_debt_reminder,
        notif_settlement=current_user.notif_settlement,
    )

@router.patch("/me/notifications/preferences", response_model=NotificationPreferences)
def update_notification_preferences(
    payload: NotificationPreferences,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.notif_new_expense is not None:
        current_user.notif_new_expense = payload.notif_new_expense
    if payload.notif_debt_reminder is not None:
        current_user.notif_debt_reminder = payload.notif_debt_reminder
    if payload.notif_settlement is not None:
        current_user.notif_settlement = payload.notif_settlement
    db.commit()
    db.refresh(current_user)
    return NotificationPreferences(
        notif_new_expense=current_user.notif_new_expense,
        notif_debt_reminder=current_user.notif_debt_reminder,
        notif_settlement=current_user.notif_settlement,
    )

@router.get("/me/activities")
def my_activities(
    limit: int = Query(default=20, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
    db=Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_my_activities(db, current_user.id, limit=limit, skip=skip)

@router.get("/me/notifications")
def my_notifications(db=Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_my_notifications(db, current_user.id)

@router.get("/me/financial-score")
def my_financial_score(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_financial_score(db, current_user.id)
