from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=255)
    role: UserRole = Field(default=UserRole.CUSTOMER)
    phone: Optional[str] = None
    company: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    role: Optional[UserRole] = UserRole.CUSTOMER
    phone: Optional[str] = None
    company: Optional[str] = None
    tenant_slug: Optional[str] = Field(default="default-tenant", description="Target tenant slug")


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Optional[UserRole] = None
    tenant_slug: Optional[str] = None


class UserResponse(UserBase):
    id: str
    tenant_id: str
    avatar_initials: str
    is_active: bool
    presence: str = "offline"
    team_id: Optional[str] = None
    skills_json: Optional[str] = "[]"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = None
    company: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    team_id: Optional[str] = None
    skills_json: Optional[str] = None


class WorkspaceUserCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRole = Field(default=UserRole.AGENT)
    phone: Optional[str] = None
    company: Optional[str] = None
    team_id: Optional[str] = None
    skills_json: Optional[str] = "[]"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr
    tenant_slug: Optional[str] = "default-tenant"


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, max_length=128)


