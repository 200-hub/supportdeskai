from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    domain: Optional[str] = None
    description: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    description: Optional[str] = None


class OrganizationResponse(OrganizationBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContactBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    whatsapp_id: Optional[str] = None
    notes: Optional[str] = None
    organization_id: Optional[str] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    whatsapp_id: Optional[str] = None
    notes: Optional[str] = None
    organization_id: Optional[str] = None


class ContactResponse(ContactBase):
    id: str
    tenant_id: str
    avatar_initials: str
    created_at: datetime
    updated_at: datetime
    organization: Optional[OrganizationResponse] = None

    model_config = ConfigDict(from_attributes=True)

