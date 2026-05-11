from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.models.expense import Expense, ExpenseSplit
from app.models.group import Group, GroupMember
from app.constants import EXPENSE_CATEGORY_ICONS


def get_my_activities(db: Session, user_id: UUID, limit: int = 10):
    # Ambil semua group_id milik user
    group_ids = [
        m.group_id for m in
        db.query(GroupMember.group_id).filter(GroupMember.user_id == user_id).all()
    ]
    if not group_ids:
        return []

    # Single query: expenses yang melibatkan user (paid_by atau split),
    # eager load group + splits sekaligus
    expenses = (
        db.query(Expense)
        .options(
            joinedload(Expense.group),
            joinedload(Expense.splits),
        )
        .filter(Expense.group_id.in_(group_ids))
        .order_by(Expense.created_at.desc())
        .limit(limit * 3)  # ambil lebih, filter setelah
        .all()
    )

    result = []
    seen = set()
    for exp in expenses:
        if exp.id in seen:
            continue

        paid_by_me = exp.paid_by == user_id
        split_row = next((s for s in exp.splits if s.user_id == user_id), None)

        # Hanya tampilkan expense yang melibatkan user ini
        if not paid_by_me and split_row is None:
            continue

        seen.add(exp.id)
        amount_display = float(exp.amount) if paid_by_me else (float(split_row.amount_owed) if split_row else 0)
        date_str = exp.date.strftime("%d %b %Y").lstrip("0") if exp.date else ""

        result.append({
            "id": str(exp.id),
            "title": exp.title,
            "group_name": exp.group.name if exp.group else "",
            "category": exp.category or "lainnya",
            "icon": EXPENSE_CATEGORY_ICONS.get(exp.category or "lainnya", "category"),
            "amount": amount_display,
            "paid_by_me": paid_by_me,
            "date": date_str,
        })

        if len(result) >= limit:
            break

    return result

def get_my_notifications(db: Session, user_id: UUID):
    notifications = []
    
    # 1. Group Invitations (pending)
    invites = db.query(GroupMember).options(joinedload(GroupMember.group)).filter(
        GroupMember.user_id == user_id, 
        GroupMember.status == "pending"
    ).all()
    
    for inv in invites:
        notifications.append({
            "id": f"inv_{inv.id}",
            "type": "group_invite",
            "title": "Undangan Grup",
            "message": f"Kamu diundang ke grup '{inv.group.name}'.",
            "timestamp": inv.joined_at,
            "group_id": inv.group_id
        })
        
    # 2. Pending Settlements (to_user == user_id)
    from app.models.settlement import Settlement
    from app.models.user import User
    
    pending_settlements = db.query(Settlement).options(joinedload(Settlement.sender)).filter(
        Settlement.to_user == user_id,
        Settlement.status == "pending"
    ).all()
    
    for ps in pending_settlements:
        sender_name = ps.sender.name if ps.sender else "Seseorang"
        notifications.append({
            "id": f"ps_{ps.id}",
            "type": "settlement_pending",
            "title": "Persetujuan Pembayaran",
            "message": f"{sender_name} melaporkan telah membayar Rp {int(ps.amount)}.",
            "timestamp": ps.settled_at,
            "group_id": ps.group_id,
            "settlement_id": ps.id
        })
        
    # 3. Confirmed Settlements
    confirmed_settlements = db.query(Settlement).options(joinedload(Settlement.sender)).filter(
        Settlement.to_user == user_id,
        Settlement.status == "confirmed"
    ).order_by(Settlement.settled_at.desc()).limit(10).all()
    
    for cs in confirmed_settlements:
        sender_name = cs.sender.name if cs.sender else "Seseorang"
        notifications.append({
            "id": f"cs_{cs.id}",
            "type": "settlement_confirmed",
            "title": "Pembayaran Diterima",
            "message": f"{sender_name} telah membayar Rp {int(cs.amount)}.",
            "timestamp": cs.settled_at,
            "group_id": cs.group_id
        })
        
    # 4. Debt Reminders (I am creditor, they haven't paid)
    unpaid_splits = db.query(ExpenseSplit).join(Expense).options(
        joinedload(ExpenseSplit.user),
        joinedload(ExpenseSplit.expense).joinedload(Expense.group)
    ).filter(
        Expense.paid_by == user_id,
        ExpenseSplit.user_id != user_id,
        ExpenseSplit.is_settled.is_(False)
    ).order_by(Expense.created_at.desc()).limit(10).all()
    
    for split in unpaid_splits:
        debtor_name = split.user.name if split.user else "Seseorang"
        group_name = split.expense.group.name if split.expense.group else "grup"
        notifications.append({
            "id": f"debt_{split.id}",
            "type": "debt_reminder",
            "title": "Tagihan Belum Dibayar",
            "message": f"{debtor_name} belum membayar tagihan '{split.expense.title}' sebesar Rp {int(split.amount_owed)} di {group_name}.",
            "timestamp": split.expense.created_at,
            "group_id": split.expense.group_id,
            "expense_id": split.expense_id,
            "user_id": split.user_id,
            "last_reminded_at": split.last_reminded_at
        })
        
    # 5. Buzzed Reminders (I am debtor, I was buzzed)
    buzzed_splits = db.query(ExpenseSplit).join(Expense).options(
        joinedload(ExpenseSplit.expense).joinedload(Expense.payer),
        joinedload(ExpenseSplit.expense).joinedload(Expense.group)
    ).filter(
        ExpenseSplit.user_id == user_id,
        ExpenseSplit.is_settled.is_(False),
        ExpenseSplit.last_reminded_at.isnot(None)
    ).order_by(ExpenseSplit.last_reminded_at.desc()).limit(10).all()

    for split in buzzed_splits:
        creditor_name = split.expense.payer.name if split.expense.payer else "Seseorang"
        group_name = split.expense.group.name if split.expense.group else "grup"
        notifications.append({
            "id": f"buzzed_{split.id}",
            "type": "buzzed_reminder",
            "title": "Pengingat Tagihan!",
            "message": f"{creditor_name} mengingatkanmu untuk membayar tagihan '{split.expense.title}' sebesar Rp {int(split.amount_owed)} di {group_name}.",
            "timestamp": split.last_reminded_at,
            "group_id": split.expense.group_id
        })
        
    # Sort by timestamp descending
    from datetime import datetime as dt, timezone
    now = dt.now(timezone.utc)
    
    for n in notifications:
        if not n["timestamp"]:
            n["timestamp"] = now
            
    notifications.sort(key=lambda x: x["timestamp"], reverse=True)
    
    # Format time_ago
    for n in notifications:
        ts = n["timestamp"]
        # Safely make timezone-aware using astimezone instead of replace
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        else:
            ts = ts.astimezone(timezone.utc)
        delta = now - ts
        if delta.days > 0:
            n["time_ago"] = f"{delta.days}h yang lalu"
        elif delta.seconds >= 3600:
            n["time_ago"] = f"{delta.seconds // 3600}j yang lalu"
        elif delta.seconds >= 60:
            n["time_ago"] = f"{delta.seconds // 60}m yang lalu"
        else:
            n["time_ago"] = "Baru saja"
            
    return notifications
