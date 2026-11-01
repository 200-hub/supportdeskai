from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_roles
from app.db.session import get_async_db
from app.models.user import User, UserRole
from app.schemas.crm import (
    ContactCreate,
    ContactResponse,
    ContactUpdate,
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
)
from app.services import crm as crm_service

router = APIRouter()


# Organizations
@router.post("/organizations", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    org_in: OrganizationCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await crm_service.create_organization(
        db=db,
        tenant_id=current_user.tenant_id,
        org_in=org_in,
    )


@router.get("/organizations", response_model=List[OrganizationResponse])
async def list_organizations(
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await crm_service.list_organizations(
        db=db,
        tenant_id=current_user.tenant_id,
        search=search,
    )


@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await crm_service.get_organization(
        db=db,
        org_id=org_id,
        tenant_id=current_user.tenant_id,
    )


@router.patch("/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    org_in: OrganizationUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await crm_service.update_organization(
        db=db,
        org_id=org_id,
        tenant_id=current_user.tenant_id,
        org_in=org_in,
    )


@router.delete("/organizations/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_organization(
    org_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    await crm_service.delete_organization(
        db=db,
        org_id=org_id,
        tenant_id=current_user.tenant_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Contacts
@router.post("/contacts", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact_in: ContactCreate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await crm_service.create_contact(
        db=db,
        tenant_id=current_user.tenant_id,
        contact_in=contact_in,
    )


@router.get("/contacts", response_model=List[ContactResponse])
async def list_contacts(
    search: Optional[str] = Query(None),
    organization_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await crm_service.list_contacts(
        db=db,
        tenant_id=current_user.tenant_id,
        search=search,
        organization_id=organization_id,
    )


@router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    return await crm_service.get_contact(
        db=db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
    )


@router.patch("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: str,
    contact_in: ContactUpdate,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    return await crm_service.update_contact(
        db=db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
        contact_in=contact_in,
    )


@router.delete("/contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact(
    contact_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.AGENT)),
    db: AsyncSession = Depends(get_async_db),
):
    await crm_service.delete_contact(
        db=db,
        contact_id=contact_id,
        tenant_id=current_user.tenant_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

