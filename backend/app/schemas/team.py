from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None


class TeamMemberResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str
    avatar_initials: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class TeamResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    members: Optional[List[TeamMemberResponse]] = None

    model_config = ConfigDict(from_attributes=True)

