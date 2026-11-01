from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge import KnowledgeArticle, KnowledgeTopic
from app.schemas.knowledge import KnowledgeArticleCreate, KnowledgeArticleResponse


DEFAULT_TOPICS = [
    {"id": "cat-1", "title": "Billing & Subscriptions", "icon": "card-outline", "article_count": 8},
    {"id": "cat-2", "title": "Account & Security", "icon": "shield-checkmark-outline", "article_count": 12},
    {"id": "cat-3", "title": "API & Webhooks", "icon": "code-slash-outline", "article_count": 15},
    {"id": "cat-4", "title": "Chat & Integrations", "icon": "chatbubbles-outline", "article_count": 6},
]

DEFAULT_ARTICLES = [
    {
        "id": "kb-1",
        "title": "Verifying Webhook Signatures (v2 API)",
        "category": "API & Webhooks",
        "summary": "Step-by-step guide on HMAC-SHA256 signature verification for inbound event notifications.",
        "content": (
            "Webhook Verification Guide:\n"
            "All outbound webhooks from SupportDesk AI include an 'X-SupportDesk-Signature' header.\n\n"
            "Steps:\n"
            "1. Extract the raw body payload.\n"
            "2. Compute HMAC-SHA256 using your tenant secret key.\n"
            "3. Compare the computed signature using a constant-time string comparison function."
        ),
        "reads_count": 1420,
        "helpful_yes": 94,
        "helpful_no": 4,
    },
    {
        "id": "kb-2",
        "title": "Configuring SSO via SAML 2.0 / Okta",
        "category": "Account & Security",
        "summary": "Enterprise Single Sign-On setup instructions, ACS URLs, and entity ID mappings.",
        "content": (
            "SSO Setup Instructions:\n"
            "Enterprise workspaces can enforce SAML 2.0 identity providers such as Okta, Azure AD, or Google Workspace.\n\n"
            "Configuration:\n"
            "- ACS URL: https://api.supportdesk.ai/api/v1/auth/saml/callback\n"
            "- Entity ID: urn:supportdesk:ai:sp\n"
            "- NameID Format: EmailAddress"
        ),
        "reads_count": 890,
        "helpful_yes": 88,
        "helpful_no": 3,
    },
    {
        "id": "kb-3",
        "title": "Adding & Prorating Agent Seats",
        "category": "Billing & Subscriptions",
        "summary": "How seat upgrades work, mid-cycle proration invoices, and workspace user permission tiers.",
        "content": (
            "Managing Workspace Seats:\n"
            "Workspace Owners and Admins can assign roles to agents, supervisors, and view-only analysts.\n\n"
            "- Adding Seats: Go to Settings > Workspace > Seats and click 'Add Seats'.\n"
            "- Proration: Any mid-cycle seat additions are automatically prorated on your upcoming invoice."
        ),
        "reads_count": 612,
        "helpful_yes": 92,
        "helpful_no": 2,
    },
    {
        "id": "kb-4",
        "title": "Setting up WhatsApp Business Cloud API channel",
        "category": "Chat & Integrations",
        "summary": "Meta Business Manager verification, phone number registration, and 24h session window policies.",
        "content": (
            "WhatsApp Integration:\n"
            "Connect your official Meta WhatsApp Business Cloud API account to ingest customer WhatsApp chats directly into SupportDesk AI.\n\n"
            "Features:\n"
            "- Live two-way chat synchronization\n"
            "- Automated template messages for order updates\n"
            "- Rich media attachment ingestion"
        ),
        "reads_count": 3200,
        "helpful_yes": 97,
        "helpful_no": 3,
    },
]


async def ensure_default_knowledge_data(db: AsyncSession, tenant_id: str):
    """
    Seed initial topics and articles if the tenant has none.
    """
    # Seed topics if empty
    res_topics = await db.execute(select(KnowledgeTopic))
    if not res_topics.scalars().first():
        for t_data in DEFAULT_TOPICS:
            topic = KnowledgeTopic(
                id=t_data["id"],
                title=t_data["title"],
                icon=t_data["icon"],
                article_count=t_data["article_count"],
            )
            db.add(topic)

    # Seed articles for tenant if empty
    res_articles = await db.execute(select(KnowledgeArticle).where(KnowledgeArticle.tenant_id == tenant_id))
    if not res_articles.scalars().first():
        for a_data in DEFAULT_ARTICLES:
            art = KnowledgeArticle(
                id=a_data["id"],
                tenant_id=tenant_id,
                title=a_data["title"],
                category=a_data["category"],
                summary=a_data["summary"],
                content=a_data["content"],
                reads_count=a_data["reads_count"],
                helpful_yes=a_data["helpful_yes"],
                helpful_no=a_data["helpful_no"],
            )
            db.add(art)
        await db.commit()


async def list_topics(db: AsyncSession) -> List[KnowledgeTopic]:
    """Retrieve all knowledge categories."""
    result = await db.execute(select(KnowledgeTopic))
    topics = result.scalars().all()
    if not topics:
        for t_data in DEFAULT_TOPICS:
            topic = KnowledgeTopic(
                id=t_data["id"],
                title=t_data["title"],
                icon=t_data["icon"],
                article_count=t_data["article_count"],
            )
            db.add(topic)
        await db.commit()
        result = await db.execute(select(KnowledgeTopic))
        topics = result.scalars().all()
    return list(topics)


async def list_articles(
    db: AsyncSession,
    tenant_id: str,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> List[KnowledgeArticle]:
    """
    Search and retrieve knowledge articles scoped to tenant.
    """
    await ensure_default_knowledge_data(db, tenant_id)

    query = select(KnowledgeArticle).where(KnowledgeArticle.tenant_id == tenant_id)

    if category:
        query = query.where(KnowledgeArticle.category == category)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                KnowledgeArticle.title.ilike(search_pattern),
                KnowledgeArticle.summary.ilike(search_pattern),
                KnowledgeArticle.content.ilike(search_pattern),
            )
        )

    result = await db.execute(query.order_by(KnowledgeArticle.reads_count.desc()))
    return list(result.scalars().all())


async def get_article(db: AsyncSession, article_id: str, tenant_id: str) -> KnowledgeArticle:
    """
    Fetch article and increment read count.
    """
    await ensure_default_knowledge_data(db, tenant_id)

    result = await db.execute(
        select(KnowledgeArticle).where(
            KnowledgeArticle.id == article_id,
            KnowledgeArticle.tenant_id == tenant_id
        )
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge article '{article_id}' not found"
        )

    article.reads_count += 1
    await db.commit()
    await db.refresh(article)
    return article


async def vote_article(db: AsyncSession, article_id: str, tenant_id: str, helpful: bool) -> KnowledgeArticle:
    """
    Record user feedback on knowledge article.
    """
    article = await get_article(db, article_id, tenant_id)
    if helpful:
        article.helpful_yes += 1
    else:
        article.helpful_no += 1

    await db.commit()
    await db.refresh(article)
    return article


def to_article_response(art: KnowledgeArticle) -> KnowledgeArticleResponse:
    """Helper to convert to response schema with formatted fields."""
    return KnowledgeArticleResponse(
        id=art.id,
        tenant_id=art.tenant_id,
        title=art.title,
        category=art.category,
        summary=art.summary,
        content=art.content,
        reads=f"{art.reads_count:,}",
        helpful=art.helpful_percentage,
        reads_count=art.reads_count,
        helpful_yes=art.helpful_yes,
        helpful_no=art.helpful_no,
        created_at=art.created_at,
        updated_at=art.updated_at,
    )

