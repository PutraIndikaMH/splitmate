from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.user import UserResponse
from app.constants import GROUP_CATEGORY_ICONS

# Re-export for backward compatibility
CATEGORY_ICONS = GROUP_CATEGORY_ICONS

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str = "other"

class GroupMemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    role: str
    status: str
    joined_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True

class GroupInviteAction(BaseModel):
    action: str # "accept" or "reject"

class GroupResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    category: str
    icon: str
    created_by: UUID
    created_at: datetime
    member_count: int = 0
    total_spending: float = 0
    status: str = "active"
    payment_status: str = "Lunas"

    class Config:
        from_attributes = True

class GroupDetailResponse(GroupResponse):
    members: List[GroupMemberResponse] = []

class AddMemberRequest(BaseModel):
    email: str
