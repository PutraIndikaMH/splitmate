from uuid import UUID
from sqlalchemy.orm import Session
from app.models.expense import ExpenseSplit

def get_financial_score(db: Session, user_id: UUID) -> dict:
    # 1. Total tagihan yang harus dibayar
    total_splits = db.query(ExpenseSplit).filter(ExpenseSplit.user_id == user_id).count()
    
    # 2. Total tagihan yang sudah lunas
    settled_splits = db.query(ExpenseSplit).filter(
        ExpenseSplit.user_id == user_id, 
        ExpenseSplit.is_settled == True
    ).count()
    
    # 3. Penalty untuk yang sering di-buzz
    # Kita anggap jika pernah di-buzz > 2 kali sudah kena pinalti
    buzzed_count = db.query(ExpenseSplit).filter(
        ExpenseSplit.user_id == user_id,
        ExpenseSplit.last_reminded_at.isnot(None)
    ).count()

    base_score = 500
    penalty = 0
    
    if buzzed_count > 2:
        penalty = 50
    elif buzzed_count > 0:
        penalty = 20

    if total_splits == 0:
        # Default Excellent untuk user baru yang belum punya tagihan
        score = 850
        label = "Excellent"
    else:
        # Perhitungan: ratio pelunasan (0-1) dikali 400 poin + base 500 - pinalti
        ratio = settled_splits / total_splits
        score = int(base_score + (ratio * 400) - penalty)
        
        # Batasi score di range 100 - 900
        score = max(100, min(900, score))
        
        if score >= 800: label = "Excellent"
        elif score >= 700: label = "Very Good"
        elif score >= 600: label = "Good"
        elif score >= 500: label = "Fair"
        else: label = "Poor"
        
    return {
        "score": score,
        "label": label,
        "details": {
            "total_splits": total_splits,
            "settled_splits": settled_splits,
            "buzzed_count": buzzed_count
        }
    }
