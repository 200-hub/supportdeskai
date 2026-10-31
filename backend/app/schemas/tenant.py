from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class TenantBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Tenant organization name")
    slug: str = Field(..., min_length=2, max_length=100, description="URL-safe unique identifier")
    plan: Optional[str] = Field(default="Standard", description="Subscription plan")


class TenantCreate(TenantBase):
    pass


class TenantResponse(TenantBase):
    id: str
    is_active: bool
    settings_json: Optional[str] = "{}"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

