from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status
from app.models.group import Group, GroupMember
from app.models.user import User
from app.models.expense import Expense, ExpenseSplit
from app.constants import GROUP_CATEGORY_ICONS
from app.dependencies import assert_group_member, assert_group_admin

def create_group(db: Session, payload, user_id: UUID) -> Group:
    group = Group(
        name=payload.name,
        description=payload.description,
        category=payload.category,
        created_by=user_id
    )
    db.add(group)
    db.flush()

    member = GroupMember(group_id=group.id, user_id=user_id, role="admin", status="accepted")
    db.add(member)
    db.commit()
    db.refresh(group)
    return group

def get_user_groups(db: Session, user_id: UUID) -> list:
    memberships = (
        db.query(GroupMember)
        .options(joinedload(GroupMember.group))
        .filter(GroupMember.user_id == user_id, GroupMember.status == "accepted")
        .all()
    )
    group_ids = [m.group_id for m in memberships]
    if not group_ids:
        return []

    member_counts = dict(
        db.query(GroupMember.group_id, func.count(GroupMember.id))
        .filter(GroupMember.group_id.in_(group_ids), GroupMember.status == "accepted")
        .group_by(GroupMember.group_id)
        .all()
    )
    total_spending = dict(
        db.query(Expense.group_id, func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.group_id.in_(group_ids))
        .group_by(Expense.group_id)
        .all()
    )
    unsettled_counts = dict(
        db.query(Expense.group_id, func.count(ExpenseSplit.id))
        .join(ExpenseSplit, ExpenseSplit.expense_id == Expense.id)
        .filter(Expense.group_id.in_(group_ids), ExpenseSplit.is_settled.is_(False))
        .group_by(Expense.group_id)
        .all()
    )

    result = []
    for m in memberships:
        group = m.group
        gid = group.id
        unsettled = unsettled_counts.get(gid, 0)
        result.append({
            "id": gid,
            "name": group.name,
            "description": group.description,
            "category": group.category,
            "icon": GROUP_CATEGORY_ICONS.get(group.category, "category"),
            "created_by": group.created_by,
            "created_at": group.created_at,
            "member_count": member_counts.get(gid, 0),
            "total_spending": float(total_spending.get(gid, 0)),
            "status": group.status,
            "payment_status": "Belum Lunas" if unsettled > 0 else "Lunas",
        })
    return result

def get_group_detail(db: Session, group_id: UUID, user_id: UUID) -> dict:
    assert_group_member(db, group_id, user_id)

    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grup tidak ditemukan")

    members = (
        db.query(GroupMember)
        .options(joinedload(GroupMember.user))
        .filter(GroupMember.group_id == group_id)
        .all()
    )

    member_count = sum(1 for m in members if m.status == "accepted")
    total = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(Expense.group_id == group_id).scalar()
    unsettled = db.query(func.count(ExpenseSplit.id)).join(
        Expense, ExpenseSplit.expense_id == Expense.id
    ).filter(
        Expense.group_id == group_id,
        ExpenseSplit.is_settled.is_(False)
    ).scalar()

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "category": group.category,
        "icon": GROUP_CATEGORY_ICONS.get(group.category, "category"),
        "created_by": group.created_by,
        "created_at": group.created_at,
        "member_count": member_count,
        "total_spending": float(total),
        "status": group.status,
        "payment_status": "Belum Lunas" if unsettled > 0 else "Lunas",
        "members": [
            {
                "id": m.id,
                "user_id": m.user_id,
                "role": m.role,
                "status": m.status,
                "joined_at": m.joined_at,
                "user": {
                    "id": m.user.id,
                    "name": m.user.name,
                    "email": m.user.email,
                    "avatar_url": m.user.avatar_url,
                    "created_at": m.user.created_at,
                }
            }
            for m in members
        ]
    }

def delete_group(db: Session, group_id: UUID, user_id: UUID):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grup tidak ditemukan")
    
    # Hanya admin/pembuat grup yang bisa menghapus
    assert_group_admin(db, group_id, user_id)
    
    if group.status != "closed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Grup harus ditutup terlebih dahulu sebelum bisa dihapus")
    
    db.delete(group)
    db.commit()

def close_group(db: Session, group_id: UUID, user_id: UUID):
    assert_group_admin(db, group_id, user_id)
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grup tidak ditemukan")
    
    # Cek apakah semua hutang lunas
    unsettled = db.query(func.count(ExpenseSplit.id)).join(
        Expense, ExpenseSplit.expense_id == Expense.id
    ).filter(
        Expense.group_id == group_id,
        ExpenseSplit.is_settled.is_(False)
    ).scalar()

    if unsettled > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Grup tidak bisa ditutup karena masih ada hutang yang belum lunas")

    group.status = "closed"
    db.commit()
    return {"message": "Grup berhasil ditutup"}

def add_member(db: Session, group_id: UUID, email: str, requester_id: UUID) -> dict:
    assert_group_member(db, group_id, requester_id)

    group = db.query(Group).filter(Group.id == group_id).first()
    if group.status == "closed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Grup sudah ditutup, tidak bisa menambah anggota baru")

    target_user = db.query(User).filter(User.email == email).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User dengan email tersebut tidak ditemukan")

    already = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == target_user.id
    ).first()
    if already:
        if already.status == "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Undangan sudah dikirim ke user ini")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User sudah menjadi anggota grup ini")

    member = GroupMember(group_id=group_id, user_id=target_user.id, role="member", status="pending")
    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "id": member.id,
        "user_id": member.user_id,
        "role": member.role,
        "status": member.status,
        "joined_at": member.joined_at,
        "user": {
            "id": target_user.id,
            "name": target_user.name,
            "email": target_user.email,
            "avatar_url": target_user.avatar_url,
            "created_at": target_user.created_at,
        }
    }

def remove_member(db: Session, group_id: UUID, target_user_id: UUID, requester_id: UUID):
    assert_group_admin(db, group_id, requester_id)

    if target_user_id == requester_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin tidak bisa mengeluarkan diri sendiri")

    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == target_user_id
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User bukan anggota grup ini")

    db.delete(member)
    db.commit()

def get_group_invitations(db: Session, user_id: UUID):
    invites = (
        db.query(GroupMember)
        .options(joinedload(GroupMember.group))
        .filter(GroupMember.user_id == user_id, GroupMember.status == "pending")
        .all()
    )
    if not invites:
        return []

    # Batch-load all inviters in one query to fix N+1
    creator_ids = list(set(inv.group.created_by for inv in invites))
    creators = db.query(User).filter(User.id.in_(creator_ids)).all()
    creator_map = {u.id: u for u in creators}

    result = []
    for inv in invites:
        group = inv.group
        inviter = creator_map.get(group.created_by)
        result.append({
            "group_id": group.id,
            "group_name": group.name,
            "group_icon": GROUP_CATEGORY_ICONS.get(group.category, "category"),
            "inviter_name": inviter.name if inviter else "Seseorang",
            "invited_at": inv.joined_at
        })
    return result

def respond_group_invitation(db: Session, user_id: UUID, group_id: UUID, action: str):
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
        GroupMember.status == "pending"
    ).first()

    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Undangan grup tidak ditemukan")

    if action == "accept":
        member.status = "accepted"
        db.commit()
        return {"message": "Undangan grup diterima"}
    elif action == "reject":
        db.delete(member)
        db.commit()
        return {"message": "Undangan grup ditolak"}
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aksi tidak valid")

