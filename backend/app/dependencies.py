from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


def get_current_user(
    access_token: str = Cookie(default=None),
    db: Session = Depends(get_db)
) -> User:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesi tidak ditemukan, silakan login kembali"
        )

    user_id = decode_access_token(access_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah expired"
        )

    user = db.query(User).filter(User.id == UUID(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User tidak ditemukan"
        )

    return user


# ============================================
# Shared Group Authorization Helpers
# ============================================

def assert_group_member(db: Session, group_id: UUID, user_id: UUID):
    """Assert that user is an ACCEPTED member of the group."""
    from app.models.group import GroupMember
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
        GroupMember.status == "accepted"
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kamu bukan anggota grup ini"
        )


def assert_group_admin(db: Session, group_id: UUID, user_id: UUID):
    """Assert that user is an admin of the group."""
    from app.models.group import GroupMember
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
        GroupMember.role == "admin",
        GroupMember.status == "accepted"
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya admin yang bisa melakukan aksi ini"
        )

