from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------- SLA Schemas ----------------
VALID_SLA_PRIORITIES = ("urgent", "high", "medium", "low")


class SLAPolicyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    priority: str = Field(default="medium", description="Target priority (urgent, high, medium, low)")
    first_response_time_minutes: int = Field(default=60, ge=1)
    resolution_time_minutes: int = Field(default=240, ge=1)
    business_hours_only: bool = True
    is_active: bool = True


class SLAPolicyCreate(SLAPolicyBase):
    pass


class SLAPolicyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    priority: Optional[str] = None
    first_response_time_minutes: Optional[int] = Field(None, ge=1)
    resolution_time_minutes: Optional[int] = Field(None, ge=1)
    business_hours_only: Optional[bool] = None
    is_active: Optional[bool] = None


class SLAPolicyResponse(SLAPolicyBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SLAEvaluationResponse(BaseModel):
    ticket_id: str
    priority: str
    sla_status: str  # 'safe', 'at-risk', 'breached'
    sla_remaining: str
    first_response_due_minutes: int
    resolution_due_minutes: int
    is_paused: bool
    response_deadline: Optional[datetime] = None
    resolution_deadline: Optional[datetime] = None


# ---------------- Routing Schemas ----------------
VALID_ROUTING_STRATEGIES = ("round_robin", "least_loaded", "skills_based")


class RoutingRuleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    strategy: str = Field(default="round_robin", description="round_robin, least_loaded, skills_based")
    target_team_id: Optional[str] = None
    required_skill: Optional[str] = None
    channel: Optional[str] = None
    is_active: bool = True
    priority_order: int = 1


class RoutingRuleCreate(RoutingRuleBase):
    pass


class RoutingRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    strategy: Optional[str] = None
    target_team_id: Optional[str] = None
    required_skill: Optional[str] = None
    channel: Optional[str] = None
    is_active: Optional[bool] = None
    priority_order: Optional[int] = None


class RoutingRuleResponse(RoutingRuleBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoutingAssignResponse(BaseModel):
    ticket_id: str
    assigned_to_id: Optional[str]
    assigned_to_name: Optional[str]
    strategy_used: str
    message: str


# ---------------- Macro Schemas ----------------
class MacroBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    actions: Dict[str, Any] = Field(..., description="Action payload (response_text, status, priority)")
    is_active: bool = True


class MacroCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    actions: Dict[str, Any]
    is_active: bool = True


class MacroResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    description: Optional[str]
    actions: Dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------- Automation Schemas ----------------
class AutomationRuleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    trigger_event: str = Field(default="ticket_created", description="ticket_created, ticket_updated")
    conditions: List[Dict[str, Any]] = Field(default=[], description="List of conditions: [{field, op, value}]")
    actions: List[Dict[str, Any]] = Field(..., description="List of actions: [{action, value}]")
    is_active: bool = True


class AutomationRuleResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    trigger_event: str
    conditions: List[Dict[str, Any]]
    actions: List[Dict[str, Any]]
    is_active: bool
    execution_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------- Invitations & Workspace Schemas ----------------
class UserInvitationCreate(BaseModel):
    email: EmailStr
    role: str = "agent"


class BulkInvitationCreate(BaseModel):
    emails: List[EmailStr] = Field(..., min_length=1, max_length=50)
    role: str = "agent"


class UserInvitationResponse(BaseModel):
    id: str
    tenant_id: str
    email: str
    role: str
    invitation_token: str
    is_accepted: bool
    expires_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvitationAcceptRequest(BaseModel):
    name: str = Field(..., min_length=2)
    password: str = Field(..., min_length=6)


class SlugAvailabilityResponse(BaseModel):
    slug: str
    is_available: bool


class WorkspaceUpdateRequest(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    business_hours: Optional[str] = None
    branding_color: Optional[str] = None

