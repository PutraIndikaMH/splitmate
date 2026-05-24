from uuid import UUID
from sqlalchemy.orm import Session
from app.models.expense import Expense, ExpenseSplit


def _days_to_speed_ratio(avg_days: float | None) -> float:
    if avg_days is None:
        return 0.5  # netral jika belum ada data pelunasan
    if avg_days <= 1:
        return 1.0
    if avg_days <= 3:
        return 0.9
    if avg_days <= 7:
        return 0.7
    if avg_days <= 14:
        return 0.5
    if avg_days <= 30:
        return 0.3
    return 0.1


def get_financial_score(db: Session, user_id: UUID) -> dict:
    splits = db.query(ExpenseSplit).filter(ExpenseSplit.user_id == user_id).all()

    total_splits = len(splits)

    if total_splits == 0:
        return {
            "score": None,
            "label": None,
            "max_score": 900,
            "details": {
                "total_splits": 0,
                "settled_splits": 0,
                "buzzed_count": 0,
                "avg_days_to_settle": None,
            },
        }

    settled = [s for s in splits if s.is_settled]
    settled_splits = len(settled)
    buzzed_count = sum(1 for s in splits if s.last_reminded_at is not None)

    # Hitung rata-rata hari dari expense dibuat sampai split dilunasi
    avg_days = None
    if settled:
        settled_ids = [s.id for s in settled]
        rows = (
            db.query(ExpenseSplit.settled_at, Expense.created_at)
            .join(Expense, ExpenseSplit.expense_id == Expense.id)
            .filter(ExpenseSplit.id.in_(settled_ids))
            .filter(ExpenseSplit.settled_at.isnot(None))
            .all()
        )
        day_deltas = [
            (r.settled_at - r.created_at).days
            for r in rows
            if r.settled_at and r.created_at and (r.settled_at - r.created_at).days >= 0
        ]
        if day_deltas:
            avg_days = sum(day_deltas) / len(day_deltas)

    # Empat komponen berbobot
    settlement_ratio = settled_splits / total_splits          # 40%
    speed_ratio      = _days_to_speed_ratio(avg_days)         # 30%
    no_buzz_ratio    = 1 - (buzzed_count / total_splits)      # 20%
    data_confidence  = min(total_splits / 10, 1.0)            # 10%

    raw = (
        settlement_ratio * 0.40
        + speed_ratio    * 0.30
        + no_buzz_ratio  * 0.20
        + data_confidence * 0.10
    )

    score = int(100 + raw * 800)
    score = max(100, min(900, score))

    if score >= 800:
        label = "Sangat Baik"
    elif score >= 700:
        label = "Baik"
    elif score >= 600:
        label = "Cukup Baik"
    elif score >= 500:
        label = "Cukup"
    else:
        label = "Perlu Perhatian"

    return {
        "score": score,
        "label": label,
        "max_score": 900,
        "details": {
            "total_splits": total_splits,
            "settled_splits": settled_splits,
            "buzzed_count": buzzed_count,
            "avg_days_to_settle": round(avg_days, 1) if avg_days is not None else None,
        },
    }
