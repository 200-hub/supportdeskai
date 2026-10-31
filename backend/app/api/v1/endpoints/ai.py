from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_async_db
from app.models.user import User
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AICopilotRequest,
    AICopilotResponse,
)
from app.services import ai as ai_service

router = APIRouter()


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_ai(
    request: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Generate an AI-powered conversational answer grounded on workspace knowledge base.
    """
    return await ai_service.generate_ai_chat_response(
        db=db,
        tenant_id=current_user.tenant_id,
        request=request,
    )


@router.post("/copilot", response_model=AICopilotResponse)
async def agent_copilot(
    request: AICopilotRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Generate AI Copilot suggestions, draft responses, and action items for support agents.
    """
    return await ai_service.generate_copilot_assistance(
        db=db,
        tenant_id=current_user.tenant_id,
        request=request,
    )

