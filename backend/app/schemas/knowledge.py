from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class KnowledgeTopicResponse(BaseModel):
    id: str
    title: str
    icon: str
    article_count: int

    model_config = ConfigDict(from_attributes=True)


class KnowledgeArticleBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    category: str = Field(..., min_length=2, max_length=100)
    summary: str = Field(..., min_length=5)
    content: str = Field(..., min_length=10)


class KnowledgeArticleCreate(KnowledgeArticleBase):
    pass


class KnowledgeArticleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None


class KnowledgeArticleResponse(KnowledgeArticleBase):
    id: str
    tenant_id: str
    reads: str = "0"
    helpful: str = "100%"
    reads_count: int
    helpful_yes: int
    helpful_no: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



class KnowledgeVoteRequest(BaseModel):
    helpful: bool
