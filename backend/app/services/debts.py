from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.group import Group, GroupMember
from app.models.expense import Expense, ExpenseSplit
from app.models.user import User
from app.dependencies import assert_group_member


def get_group_debts(db: Session, group_id: UUID, current_user_id: UUID) -> dict:
    assert_group_member(db, group_id, current_user_id)

    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grup tidak ditemukan")

    # Single query: semua members + user data sekaligus
    members = (
        db.query(GroupMember)
        .options(joinedload(GroupMember.user))
        .filter(GroupMember.group_id == group_id, GroupMember.status == "accepted")
        .all()
    )
    member_ids = [m.user_id for m in members]
    balances = {uid: 0.0 for uid in member_ids}

    # Single query: semua expenses + splits sekaligus
    expenses = (
        db.query(Expense)
        .options(joinedload(Expense.splits))
        .filter(Expense.group_id == group_id)
        .all()
    )

    for exp in expenses:
        for s in exp.splits:
            if not s.is_settled and s.user_id != exp.paid_by:
                balances[exp.paid_by] = balances.get(exp.paid_by, 0) + float(s.amount_owed)
                balances[s.user_id] = balances.get(s.user_id, 0) - float(s.amount_owed)

    from app.models.settlement import Settlement
    pending_settlements = db.query(Settlement).filter(
        Settlement.group_id == group_id, 
        Settlement.status == "pending"
    ).all()
    
    for ps in pending_settlements:
        balances[ps.to_user] = balances.get(ps.to_user, 0) - float(ps.amount)
        balances[ps.from_user] = balances.get(ps.from_user, 0) + float(ps.amount)

    member_balances = []
    for m in members:
        bal = balances.get(m.user_id, 0)
        member_balances.append({
            "user_id": m.user_id,
            "user_name": m.user.name if m.user else "Unknown",
            "avatar_url": m.user.avatar_url if m.user else None,
            "balance": round(bal, 2),
            "status": "Is owed" if bal > 0 else ("Owes" if bal < 0 else "Settled"),
            "amount": round(abs(bal), 2)
        })

    # Preload semua user untuk settlement calculation
    user_map = {m.user_id: m.user for m in members}
    settlements = _calculate_settlements(balances, user_map)

    return {
        "group_id": group_id,
        "group_name": group.name,
        "member_balances": member_balances,
        "settlements": settlements
    }


def get_my_debts(db: Session, current_user_id: UUID) -> dict:
    # Single query: semua membership + group sekaligus
    memberships = (
        db.query(GroupMember)
        .options(joinedload(GroupMember.group))
        .filter(GroupMember.user_id == current_user_id, GroupMember.status == "accepted")
        .all()
    )

    group_ids = [m.group_id for m in memberships]
    if not group_ids:
        return {"total_hutang": 0.0, "total_piutang": 0.0, "owe_count": 0, "owed_count": 0, "owe": [], "owed": []}

    # Single query: semua expenses di semua grup + splits + payer sekaligus
    expenses = (
        db.query(Expense)
        .options(
            joinedload(Expense.splits),
            joinedload(Expense.payer),
        )
        .filter(
            Expense.group_id.in_(group_ids),
        )
        .all()
    )

    # Kumpulkan semua user_id yang perlu di-lookup (debtors)
    debtor_ids = set()
    for exp in expenses:
        if exp.paid_by == current_user_id:
            for s in exp.splits:
                if not s.is_settled and s.user_id != current_user_id:
                    debtor_ids.add(s.user_id)

    # Single query untuk semua debtors
    debtors_map = {}
    if debtor_ids:
        debtors = db.query(User).filter(User.id.in_(debtor_ids)).all()
        debtors_map = {u.id: u for u in debtors}

    # Build group map
    group_map = {m.group_id: m.group for m in memberships}

    owe_list = []
    owed_list = []
    total_hutang = 0.0
    total_piutang = 0.0

    for exp in expenses:
        group = group_map.get(exp.group_id)
        if not group:
            continue

        for s in exp.splits:
            if s.is_settled:
                continue

            if s.user_id == current_user_id and exp.paid_by != current_user_id:
                total_hutang += float(s.amount_owed)
                owe_list.append({
                    "expense_split_id": s.id,
                    "expense_id": exp.id,
                    "expense_title": exp.title,
                    "group_id": group.id,
                    "group_name": group.name,
                    "to_user_id": exp.paid_by,
                    "to_user_name": exp.payer.name if exp.payer else "Unknown",
                    "to_user_avatar": exp.payer.avatar_url if exp.payer else None,
                    "amount": float(s.amount_owed),
                    "status": "Belum Lunas"
                })

            elif exp.paid_by == current_user_id and s.user_id != current_user_id:
                debtor = debtors_map.get(s.user_id)
                total_piutang += float(s.amount_owed)
                owed_list.append({
                    "expense_split_id": s.id,
                    "expense_id": exp.id,
                    "expense_title": exp.title,
                    "group_id": group.id,
                    "group_name": group.name,
                    "from_user_id": s.user_id,
                    "from_user_name": debtor.name if debtor else "Unknown",
                    "from_user_avatar": debtor.avatar_url if debtor else None,
                    "amount": float(s.amount_owed),
                    "status": "Belum Lunas"
                })

    return {
        "total_hutang": round(total_hutang, 2),
        "total_piutang": round(total_piutang, 2),
        "owe_count": len(owe_list),
        "owed_count": len(owed_list),
        "owe": owe_list,
        "owed": owed_list
    }


def _calculate_settlements(balances: dict, user_map: dict) -> list:
    creditors = sorted(
        [[uid, bal] for uid, bal in balances.items() if bal > 0.01],
        key=lambda x: -x[1]
    )
    debtors = sorted(
        [[uid, -bal] for uid, bal in balances.items() if bal < -0.01],
        key=lambda x: -x[1]
    )

    settlements = []
    i, j = 0, 0
    while i < len(creditors) and j < len(debtors):
        creditor_id, credit = creditors[i]
        debtor_id, debt = debtors[j]
        amount = min(credit, debt)

        creditor = user_map.get(creditor_id)
        debtor = user_map.get(debtor_id)

        settlements.append({
            "from_user_id": debtor_id,
            "from_user_name": debtor.name if debtor else "Unknown",
            "to_user_id": creditor_id,
            "to_user_name": creditor.name if creditor else "Unknown",
            "amount": round(amount, 2)
        })

        creditors[i][1] -= amount
        debtors[j][1] -= amount
        if creditors[i][1] < 0.01:
            i += 1
        if debtors[j][1] < 0.01:
            j += 1

    return settlements


