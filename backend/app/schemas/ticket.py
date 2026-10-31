from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.ticket import TicketChannel, TicketPriority, TicketStatus, MessageSenderType
from app.schemas.user import UserResponse


class TicketMessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    sender_type: Optional[MessageSenderType] = MessageSenderType.CUSTOMER
    sender_name: Optional[str] = "Anonymous"


class TicketMessageCreate(TicketMessageBase):
    pass


class TicketMessageResponse(TicketMessageBase):
    id: str
    ticket_id: str
    sender_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketBase(BaseModel):
    subject: str = Field(..., min_length=2, max_length=500)
    description: str = Field(..., min_length=2)
    category: Optional[str] = "General Support"
    channel: Optional[TicketChannel] = TicketChannel.WEB
    priority: Optional[TicketPriority] = TicketPriority.MEDIUM


class TicketCreate(TicketBase):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_company: Optional[str] = None


class TicketTimelineResponse(BaseModel):
    id: str
    ticket_id: str
    title: str
    by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_to_id: Optional[str] = None
    team_id: Optional[str] = None
    tags_json: Optional[str] = None
    sla_paused: Optional[bool] = None
    sla_remaining: Optional[str] = None
    sla_status: Optional[str] = None


class TicketResponse(TicketBase):
    id: str
    tenant_id: str
    status: TicketStatus
    customer_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    team_id: Optional[str] = None
    tags_json: Optional[str] = "[]"
    sla_paused: bool = False
    sla_remaining: Optional[str] = None
    sla_status: str = "safe"
    ai_confidence: Optional[str] = None
    ai_suggested_action: Optional[str] = None
    is_deleted: bool = False
    is_spam: bool = False
    merged_into_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    customer: Optional[UserResponse] = None
    assignee: Optional[UserResponse] = None
    messages: Optional[List[TicketMessageResponse]] = []
    timeline: Optional[List[TicketTimelineResponse]] = []

    model_config = ConfigDict(from_attributes=True)



class TicketListResponse(BaseModel):
    total: int
    page: int
    limit: int
    tickets: List[TicketResponse]
