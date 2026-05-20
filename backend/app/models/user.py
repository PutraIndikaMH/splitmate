import uuid
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Notification preferences
    notif_new_expense = Column(Boolean, nullable=False, server_default="true")
    notif_debt_reminder = Column(Boolean, nullable=False, server_default="true")
    notif_settlement = Column(Boolean, nullable=False, server_default="true")

    groups_created = relationship("Group", back_populates="creator")
    group_memberships = relationship("GroupMember", back_populates="user")
    expenses_paid = relationship("Expense", back_populates="payer")
    expense_splits = relationship("ExpenseSplit", back_populates="user")
    settlements_sent = relationship("Settlement", foreign_keys="Settlement.from_user", back_populates="sender")
    settlements_received = relationship("Settlement", foreign_keys="Settlement.to_user", back_populates="receiver")
    ai_predictions = relationship("AIPrediction", back_populates="user")
