from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.crm import Contact, Organization
from app.schemas.crm import (
    ContactCreate,
    ContactUpdate,
    OrganizationCreate,
    OrganizationUpdate,
)


def extract_initials(name: str) -> str:
    parts = name.strip().split()
    if not parts:
        return "CU"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


# ---------------- Organizations ----------------
async def create_organization(
    db: AsyncSession,
    tenant_id: str,
    org_in: OrganizationCreate,
) -> Organization:
    org = Organization(
        tenant_id=tenant_id,
        name=org_in.name.strip(),
        domain=org_in.domain.strip() if org_in.domain else None,
        description=org_in.description,
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return org


async def list_organizations(
    db: AsyncSession,
    tenant_id: str,
    search: Optional[str] = None,
) -> List[Organization]:
    query = select(Organization).where(Organization.tenant_id == tenant_id)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                Organization.name.ilike(pattern),
                Organization.domain.ilike(pattern),
            )
        )
    result = await db.execute(query.order_by(Organization.name.asc()))
    return list(result.scalars().all())


async def get_organization(
    db: AsyncSession,
    org_id: str,
    tenant_id: str,
) -> Organization:
    query = select(Organization).where(
        Organization.id == org_id,
        Organization.tenant_id == tenant_id
    )
    result = await db.execute(query)
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization '{org_id}' not found"
        )
    return org


async def update_organization(
    db: AsyncSession,
    org_id: str,
    tenant_id: str,
    org_in: OrganizationUpdate,
) -> Organization:
    org = await get_organization(db, org_id, tenant_id)
    if org_in.name is not None:
        stripped_name = org_in.name.strip()
        if len(stripped_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Organization name must be at least 2 characters",
            )
        org.name = stripped_name
    if org_in.domain is not None:
        org.domain = org_in.domain.strip() if org_in.domain else None
    if org_in.description is not None:
        org.description = org_in.description
    await db.commit()
    await db.refresh(org)
    return org


async def delete_organization(
    db: AsyncSession,
    org_id: str,
    tenant_id: str,
) -> None:
    org = await get_organization(db, org_id, tenant_id)
    # Set organization_id to NULL on any associated contacts within this workspace
    contacts_res = await db.execute(
        select(Contact).where(Contact.organization_id == org.id, Contact.tenant_id == tenant_id)
    )
    for c in contacts_res.scalars().all():
        c.organization_id = None
    await db.delete(org)
    await db.commit()


# ---------------- Contacts ----------------
async def create_contact(
    db: AsyncSession,
    tenant_id: str,
    contact_in: ContactCreate,
) -> Contact:
    if contact_in.organization_id:
        org_check = await db.execute(
            select(Organization).where(
                Organization.id == contact_in.organization_id,
                Organization.tenant_id == tenant_id,
            )
        )
        if not org_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization '{contact_in.organization_id}' not found in this workspace",
            )

    normalized_email = contact_in.email.lower().strip() if contact_in.email else None
    if normalized_email:
        existing = await db.execute(
            select(Contact).where(Contact.email == normalized_email, Contact.tenant_id == tenant_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contact with email '{contact_in.email}' already exists in this workspace",
            )

    initials = extract_initials(contact_in.name)
    contact = Contact(
        tenant_id=tenant_id,
        organization_id=contact_in.organization_id,
        name=contact_in.name.strip(),
        email=normalized_email,
        phone=contact_in.phone,
        whatsapp_id=contact_in.whatsapp_id,
        notes=contact_in.notes,
        avatar_initials=initials,
    )
    db.add(contact)
    await db.commit()
    query = (
        select(Contact)
        .where(Contact.id == contact.id)
        .options(selectinload(Contact.organization))
    )
    res = await db.execute(query)
    return res.scalar_one()


async def list_contacts(
    db: AsyncSession,
    tenant_id: str,
    search: Optional[str] = None,
    organization_id: Optional[str] = None,
) -> List[Contact]:
    query = (
        select(Contact)
        .where(Contact.tenant_id == tenant_id)
        .options(selectinload(Contact.organization))
    )
    if organization_id:
        query = query.where(Contact.organization_id == organization_id)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                Contact.name.ilike(pattern),
                Contact.email.ilike(pattern),
                Contact.phone.ilike(pattern),
            )
        )
    result = await db.execute(query.order_by(Contact.name.asc()))
    return list(result.scalars().all())


async def get_contact(
    db: AsyncSession,
    contact_id: str,
    tenant_id: str,
) -> Contact:
    query = (
        select(Contact)
        .where(Contact.id == contact_id, Contact.tenant_id == tenant_id)
        .options(selectinload(Contact.organization))
    )
    result = await db.execute(query)
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contact '{contact_id}' not found"
        )
    return contact


async def update_contact(
    db: AsyncSession,
    contact_id: str,
    tenant_id: str,
    contact_in: ContactUpdate,
) -> Contact:
    contact = await get_contact(db, contact_id, tenant_id)

    if contact_in.organization_id is not None:
        if contact_in.organization_id == "":
            contact.organization_id = None
        else:
            org_check = await db.execute(
                select(Organization).where(
                    Organization.id == contact_in.organization_id,
                    Organization.tenant_id == tenant_id,
                )
            )
            if not org_check.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization '{contact_in.organization_id}' not found in this workspace",
                )
            contact.organization_id = contact_in.organization_id

    if contact_in.email is not None:
        normalized_email = contact_in.email.lower().strip() if contact_in.email else None
        if normalized_email and normalized_email != (contact.email or ""):
            existing = await db.execute(
                select(Contact).where(
                    Contact.email == normalized_email,
                    Contact.tenant_id == tenant_id,
                    Contact.id != contact.id,
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Contact with email '{contact_in.email}' already exists in this workspace",
                )
        contact.email = normalized_email

    if contact_in.name is not None:
        stripped_name = contact_in.name.strip()
        if len(stripped_name) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Contact name must be at least 2 characters",
            )
        contact.name = stripped_name
        contact.avatar_initials = extract_initials(stripped_name)

    if contact_in.phone is not None:
        contact.phone = contact_in.phone
    if contact_in.whatsapp_id is not None:
        contact.whatsapp_id = contact_in.whatsapp_id
    if contact_in.notes is not None:
        contact.notes = contact_in.notes

    await db.commit()
    return await get_contact(db, contact_id, tenant_id)


async def delete_contact(
    db: AsyncSession,
    contact_id: str,
    tenant_id: str,
) -> None:
    contact = await get_contact(db, contact_id, tenant_id)
    await db.delete(contact)
    await db.commit()

