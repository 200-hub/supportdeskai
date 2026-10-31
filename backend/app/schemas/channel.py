from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.channel import ChannelType


class ChannelBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    type: ChannelType
    is_active: bool = True
    config_json: Optional[str] = "{}"


class ChannelCreate(ChannelBase):
    pass


class ChannelUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    is_active: Optional[bool] = None
    config_json: Optional[str] = None


class ChannelResponse(ChannelBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicFormBase(BaseModel):
    slug: str = Field(..., min_length=2, max_length=100)
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    fields_schema_json: Optional[str] = "[]"
    is_active: bool = True


class PublicFormCreate(PublicFormBase):
    pass


class PublicFormResponse(PublicFormBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicFormSubmission(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    subject: str = Field(..., min_length=2)
    message: str = Field(..., min_length=2)
    category: Optional[str] = "General Support"
    custom_fields: Optional[Dict[str, Any]] = None


class WebChatInitRequest(BaseModel):
    tenant_slug: str = "default-tenant"
    visitor_name: Optional[str] = None
    visitor_email: Optional[EmailStr] = None


class WebChatInitResponse(BaseModel):
    session_id: str
    visitor_token: str
    tenant_name: str
    welcome_message: str


class WebChatMessageRequest(BaseModel):
    visitor_token: str
    message: str = Field(..., min_length=1)
    ticket_id: Optional[str] = None

