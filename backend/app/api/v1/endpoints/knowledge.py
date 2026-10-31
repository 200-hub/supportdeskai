from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_async_db
from app.models.user import User
from app.schemas.knowledge import (
    KnowledgeArticleResponse,
    KnowledgeTopicResponse,
    KnowledgeVoteRequest,
)
from app.services import knowledge as knowledge_service

router = APIRouter()


@router.get("/topics", response_model=List[KnowledgeTopicResponse])
async def get_topics(
    db: AsyncSession = Depends(get_async_db),
):
    """
    List knowledge base categories and article counts.
    """
    topics = await knowledge_service.list_topics(db)
    return topics


@router.get("/articles", response_model=List[KnowledgeArticleResponse])
async def get_articles(
    category: Optional[str] = Query(None, description="Filter articles by category"),
    search: Optional[str] = Query(None, description="Search query across title and content"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Retrieve or search knowledge base articles for the current workspace.
    """
    articles = await knowledge_service.list_articles(
        db=db,
        tenant_id=current_user.tenant_id,
        category=category,
        search=search,
    )
    return [knowledge_service.to_article_response(a) for a in articles]


@router.get("/articles/{article_id}", response_model=KnowledgeArticleResponse)
async def get_article(
    article_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Retrieve a specific knowledge base article and increment its view count.
    """
    article = await knowledge_service.get_article(
        db=db,
        article_id=article_id,
        tenant_id=current_user.tenant_id,
    )
    return knowledge_service.to_article_response(article)


@router.post("/articles/{article_id}/vote", response_model=KnowledgeArticleResponse)
async def vote_article(
    article_id: str,
    vote_data: KnowledgeVoteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Vote whether an article was helpful or not.
    """
    article = await knowledge_service.vote_article(
        db=db,
        article_id=article_id,
        tenant_id=current_user.tenant_id,
        helpful=vote_data.helpful,
    )
    return knowledge_service.to_article_response(article)

