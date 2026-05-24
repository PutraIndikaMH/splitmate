from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, field_validator
from app.constants import VALID_EXPENSE_CATEGORIES

class SplitItem(BaseModel):
    user_id: UUID
    amount_owed: Decimal

class ExpenseCreate(BaseModel):
    title: str
    amount: Decimal
    category: Optional[str] = "lainnya"
    paid_by: Optional[UUID] = None
    split_type: str = "equal"
    notes: Optional[str] = None
    date: Optional[date] = None
    splits: Optional[List[SplitItem]] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return "lainnya"
        if v not in VALID_EXPENSE_CATEGORIES:
            raise ValueError(f"Kategori tidak valid. Pilihan: {', '.join(VALID_EXPENSE_CATEGORIES)}")
        return v

class ExpenseSplitResponse(BaseModel):
    id: UUID
    user_id: UUID
    amount_owed: Decimal
    is_settled: bool
    settled_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExpenseResponse(BaseModel):
    id: UUID
    group_id: UUID
    paid_by: UUID
    title: str
    amount: Decimal
    category: Optional[str] = None
    split_type: str
    notes: Optional[str] = None
    date: date
    created_at: datetime
    splits: List[ExpenseSplitResponse] = []

    class Config:
        from_attributes = True
