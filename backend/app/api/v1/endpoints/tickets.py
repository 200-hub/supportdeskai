from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.db.session import get_async_db
from app.models.ticket import TicketChannel, TicketPriority, TicketStatus
from app.models.user import User, UserRole
from app.schemas.ticket import (
    TicketCreate,
    TicketListResponse,
    TicketMessageCreate,
    TicketMessageResponse,
    TicketResponse,
    TicketTimelineResponse,
    TicketUpdate,
)
from app.services import ticket as ticket_service

router = APIRouter()


@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_in: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Open a new support ticket.
    """
    return await ticket_service.create_ticket(
        db=db,
        tenant_id=current_user.tenant_id,
        ticket_in=ticket_in,
        current_user=current_user,
    )


@router.get("/", response_model=TicketListResponse)
async def list_tickets(
    status: Optional[TicketStatus] = Query(None, description="Filter by status (open, pending, resolved, closed)"),
    priority: Optional[TicketPriority] = Query(None, description="Filter by priority (urgent, high, medium, low)"),
    channel: Optional[TicketChannel] = Query(None, description="Filter by channel (email, whatsapp, chat, web)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    List support tickets with filtering and pagination. Customers view their own tickets; agents view all tenant tickets.
    """
    tickets, total = await ticket_service.list_tickets(
        db=db,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
        status_filter=status,
        priority_filter=priority,
        channel_filter=channel,
        page=page,
        limit=limit,
    )
    return TicketListResponse(
        total=total,
        page=page,
        limit=limit,
        tickets=[TicketResponse.model_validate(t) for t in tickets],
    )


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Retrieve single ticket details and conversation thread.
    """
    ticket = await ticket_service.get_ticket(
        db=db,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
    )
    return ticket


@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: str,
    update_data: TicketUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Update ticket attributes (status, priority, assignment).
    """
    return await ticket_service.update_ticket(
        db=db,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
        update_data=update_data,
    )


@router.get("/{ticket_id}/messages", response_model=List[TicketMessageResponse])
async def get_ticket_messages(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Fetch all conversation messages for a ticket thread. Internal notes are excluded for customers.
    """
    return await ticket_service.get_ticket_messages(
        db=db,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
    )


@router.post("/{ticket_id}/messages", response_model=TicketMessageResponse, status_code=status.HTTP_201_CREATED)
async def add_ticket_message(
    ticket_id: str,
    message_in: TicketMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Send a message or internal note to a ticket thread.
    """
    return await ticket_service.add_ticket_message(
        db=db,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
        message_in=message_in,
    )




@router.get("/{ticket_id}/timeline", response_model=List[TicketTimelineResponse])
async def get_ticket_timeline(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Fetch the full audit timeline for a ticket. Customers can view their own ticket timeline.
    """
    return await ticket_service.get_ticket_timeline(
        db=db,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
    )


@router.delete("/{ticket_id}", response_model=TicketResponse)
async def delete_ticket(
    ticket_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Soft-delete ticket (move to trash).
    """
    return await ticket_service.soft_delete_ticket(
        db=db,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
    )


@router.post("/{ticket_id}/restore", response_model=TicketResponse)
async def restore_ticket(
    ticket_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Restore soft-deleted ticket.
    """
    return await ticket_service.restore_ticket(
        db=db,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
    )


@router.post("/{ticket_id}/spam", response_model=TicketResponse)
async def mark_spam(
    ticket_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Mark ticket as spam and close.
    """
    return await ticket_service.mark_ticket_spam(
        db=db,
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
    )


@router.post("/{ticket_id}/merge/{target_ticket_id}", response_model=TicketResponse)
async def merge_tickets(
    ticket_id: str,
    target_ticket_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Merge ticket into target ticket.
    """
    return await ticket_service.merge_tickets(
        db=db,
        source_ticket_id=ticket_id,
        target_ticket_id=target_ticket_id,
        tenant_id=current_user.tenant_id,
        current_user=current_user,
    )


@router.post("/{ticket_id}/collision")
async def report_collision(
    ticket_id: str,
    is_typing: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Broadcast agent collision (currently viewing or typing on ticket).
    Verifies ticket ownership before writing to the collision store to prevent
    cross-tenant information disclosure via the in-memory collision dict.
    """
    # Verify ticket exists within caller's tenant (raises 404 for cross-tenant IDs)
    await ticket_service.get_ticket(
        db=db, ticket_id=ticket_id, tenant_id=current_user.tenant_id, current_user=current_user
    )
    return ticket_service.record_collision(
        ticket_id=ticket_id,
        tenant_id=current_user.tenant_id,
        agent_name=current_user.name,
        is_typing=is_typing,
    )


@router.get("/{ticket_id}/collision")
async def check_collision(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Get current active collision status for a ticket.
    Verifies ticket ownership before reading from the collision store to prevent
    cross-tenant agent presence leakage.
    """
    # Verify ticket exists within caller's tenant (raises 404 for cross-tenant IDs)
    await ticket_service.get_ticket(
        db=db, ticket_id=ticket_id, tenant_id=current_user.tenant_id, current_user=current_user
    )
    return ticket_service.get_collision(ticket_id=ticket_id, tenant_id=current_user.tenant_id)
