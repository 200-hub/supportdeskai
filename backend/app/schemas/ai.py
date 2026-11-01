from typing import List, Optional
from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    ticket_id: Optional[str] = None
    context: Optional[str] = None


class AICitation(BaseModel):
    id: str
    title: str
    category: Optional[str] = None


class AIChatResponse(BaseModel):
    response: str
    conversation_id: str
    confidence: Optional[str] = "95%"
    citations: List[AICitation] = []
    suggested_action: Optional[str] = None
    provider: str


class AICopilotRequest(BaseModel):
    ticket_id: str
    customer_query: str
    agent_draft_notes: Optional[str] = None


class AICopilotResponse(BaseModel):
    suggested_reply: str
    suggested_action: str
    confidence: str
    relevant_articles: List[AICitation] = []

