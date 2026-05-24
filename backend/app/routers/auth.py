from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)

COOKIE_MAX_AGE = settings.jwt_expire_minutes * 60


def _auth_response(token: str, user: User, status_code: int = 200) -> JSONResponse:
    user_data = UserResponse.model_validate(user).model_dump(mode="json")
    response = JSONResponse(
        status_code=status_code,
        content={"user": user_data}
    )
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite=settings.cookie_samesite,
        secure=settings.cookie_secure,
        max_age=COOKIE_MAX_AGE,
        path="/",
    )
    return response


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email sudah terdaftar")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return _auth_response(token, user, status_code=201)


@router.post("/login")
@limiter.limit("20/minute")
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email atau password salah")

    token = create_access_token(user.id)
    return _auth_response(token, user)


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    response = JSONResponse(content={"message": "Berhasil logout"})
    response.delete_cookie(key="access_token", path="/")
    return response
