from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    health,
    tickets,
    knowledge,
    ai,
    analytics,
    crm,
    teams,
    channels,
    public,
    notifications,
    sla,
    routing,
    macros,
    automations,
    workspace,
)

api_router = APIRouter()

# Core, Auth & Workspace Management
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(workspace.router, prefix="/tenants", tags=["Tenants & Workspaces"])

# Operations, Users & Teams
api_router.include_router(teams.router, prefix="/teams", tags=["Teams"])
api_router.include_router(crm.router, prefix="/crm", tags=["CRM & Contacts"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

# Omnichannel & Channels
api_router.include_router(channels.router, prefix="/channels", tags=["Channels & Webhooks"])
api_router.include_router(public.router, prefix="/public", tags=["Public Forms & WebChat"])

# Tickets & Workflows
api_router.include_router(tickets.router, prefix="/tickets", tags=["Tickets"])
api_router.include_router(sla.router, prefix="/sla", tags=["SLA Engine"])
api_router.include_router(routing.router, prefix="/routing", tags=["Ticket Routing"])
api_router.include_router(macros.router, prefix="/macros", tags=["Macros & Canned Responses"])
api_router.include_router(automations.router, prefix="/automations", tags=["Automations & Triggers"])

# Knowledge & AI (Preserved)
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["Knowledge Base"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI & Copilot"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & SLAs"])
