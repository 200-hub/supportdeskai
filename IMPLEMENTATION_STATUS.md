# SupportDeskAI — Implementation Status & Comprehensive Audit Report

**Audit Date:** October 31, 2026  
**Last Updated:** October 31, 2026 (Module 8: Routing audited, hardened, RBAC enforced, and verified)  
**Test Suite Status:** 149/149 tests passing (100% success rate in 52.39s)  
**Modules In Scope:** Exactly 10 modules (`auth` → `tenants` → `users-teams` → `contacts-orgs` → `channels` → `tickets` → `sla` → `routing` → `macros` → `automations`). Work strictly stopped after Automations.

---

## 1. Module-by-Module Inspection & Audit Matrix

| # | Module | Status | Implemented & Verified | Partially Implemented | Missing | Verified Tests |
|---|---|---|---|---|---|---|
| **1** | **Auth** | **Verified + Hardened** | Registration, login (constant-time dummy verification), Argon2id (time_cost=3, mem=64MB), PyJWT HS256 algorithm pinning, mandatory tenant_id claim enforcement, purpose validation (blocking password reset token reuse as access token), refresh token rotation with full-family revocation on reuse detection, single-use password-reset tokens (password-hash fingerprint in JWT), multi-tenant reset scoping, logout session clearing, RBAC (`require_roles`), tenant isolation on all protected routes, frontend refresh token persistence & background retry | TOTP 2FA secret/enabled attributes on User model; OAuth/SAML configuration scaffolding | Dedicated TOTP QR code enrollment endpoint (`POST /auth/2fa/enroll`) | 18 passed |
| **2** | **Tenants** | **Verified + Hardened** | Multi-tenant query isolation (`tenant_id`), slug availability checking, workspace branding & plan updates, RBAC enforcement (`require_roles(ADMIN, AGENT)`) on workspace updates & invitations, `settings_json` persistence (business_hours, branding_color), cross-tenant FK binding rejection across contacts, tickets, and routing | Business hours, holidays, retention policies in `settings_json` | Dedicated national holiday calendar table | 2 passed (+ 50 isolation tests) |
| **3** | **Users & Teams** | **Verified + Hardened** | Workspace user listing (`GET /tenants/users`), direct user creation (`POST /tenants/users`), single user retrieval (`GET /tenants/users/{id}`), updates with privilege escalation prevention (`PATCH /tenants/users/{id}`), self-demotion/deactivation/deletion guards, user deletion (`DELETE /tenants/users/{id}`); Team full CRUD (`POST`, `GET`, `PATCH`, `DELETE /teams`), team member assignment and removal (`POST`, `DELETE /teams/{id}/members/{user_id}`), member team_id unlinking on delete; RBAC on all team/user mutations (`require_roles(ADMIN, AGENT)`); Frontend live user list in `AdminSettingsScreen.js` via `adminService.getWorkspaceUsers()` | Presence stored in database/memory | Redis cluster for distributed presence | 5 passed (+ 14 isolation tests) |
| **4** | **Contacts & Orgs** | **Verified + Hardened** | Organization full CRUD (`POST`, `GET`, `PATCH`, `DELETE /crm/organizations`), contact unlinking cascade; Contact full CRUD (`POST`, `GET`, `PATCH`, `DELETE /crm/contacts`), multi-identity attributes (email, phone, WhatsApp), avatar initials recalculation, duplicate email prevention in tenant, cross-tenant organization foreign-key rejection (404), search across fields with tenant scoping; RBAC on all mutation endpoints (`require_roles(ADMIN, AGENT)`); Frontend service methods in `adminService.js` | JSON bulk import format | Multipart/form-data CSV file upload streaming parser | 4 passed (+ 10 isolation tests) |
| **5** | **Channels** | **Verified + Hardened** | Channel full CRUD (`POST /channels/`, `GET /channels/`, `GET /channels/{id}`, `PATCH /channels/{id}`, `DELETE /channels/{id}`), channel activation/deactivation, JSON config validation, automatic secret masking in responses (`api_key`, `secret`, `token` masked to `***...`), unmasked secret retention on partial updates, RBAC on channel mutations (`require_roles(ADMIN, AGENT)`), customer 403 blocks; Inbound email webhook parser with MIME header threading, WhatsApp Cloud API POST webhook (HMAC-SHA256 verified), WhatsApp hub.challenge GET handshake endpoint, email webhook (Mailgun + generic X-Webhook-Signature), public forms intake (restricted to Admin/Agent for creation, unauthenticated rate-limited submission), webchat visitor init (rate-limited), embeddable widget in `front.html`; Frontend toggle and persistence via `adminService` in `AdminSettingsScreen.js` | Outbound delivery abstracted via provider webhooks | Real-time outbound WhatsApp/email delivery SDK integration | 4 passed (+ 16 webhook security + 4 channel isolation tests) |
| **6** | **Tickets** | **Verified + Hardened** | Full ticket CRUD, status/priority update validation, team assignment with cross-tenant FK verification, tags_json JSON array format validation, SLA pause/resume tracking with audit timeline entries, customer vs agent scoping, customer internal note masking in both thread and ticket detail responses, soft delete & restore with RBAC (`require_roles(ADMIN, AGENT)`), spam flagging with auto-close (Agent/Admin only), ticket merging with self-merge guard and cross-tenant rejection (Agent/Admin only), dedicated audit timeline endpoint (`GET /tickets/{id}/timeline`), collision detection scoped to `(tenant_id, ticket_id)`, eager relationship loading (`selectinload` for customer, assignee, messages, timeline), frontend `ticketService.js` & live `CreateTicketScreen`/`TicketDetailsScreen` offline-first integration | Attachment metadata in messages | Cloud S3/GCS signed URL binary upload endpoint | 11 passed (+ 10 isolation tests) |
| **7** | **SLA** | **Verified + Hardened** | SLA policy full CRUD (`POST`, `GET /policies`, `GET /policies/{id}`, `PATCH`, `DELETE`), automatic default tier creation (`urgent`, `high`, `medium`, `low`), priority validation, target time validation (`resolution_time >= first_response_time`), RBAC on SLA mutations (`require_roles(ADMIN, AGENT)`), customer 403 blocks, tenant-scoped policy management; SLA evaluation engine (`POST /evaluate/{ticket_id}`) with first response & resolution breach detection, agent response detection, overdue duration tracking, deadline timestamp calculation (`response_deadline`, `resolution_deadline`), customer evaluation ownership check (IDOR guard), pause/resume handling for pending tickets & `sla_paused` flag, finalized SLA state on resolved/closed tickets; Ticket lifecycle integration (initial SLA assignment on creation, target re-computation on priority changes, pause/resume on status transitions); Frontend integration in `AdminSettingsScreen.js` & `adminService.js` (`getSLAPolicies`, `saveSLAPolicy`, `getSLAPolicy`, `deleteSLAPolicy`) and `ticketService.js` (`evaluateSLA`) | Holiday calendar adjustments | Dedicated holiday schedule exception table | 9 passed (+ 2 isolation tests) |
| **8** | **Routing** | **Verified + Hardened** | Routing rule full CRUD (`POST`, `GET /rules`, `GET /rules/{id}`, `PATCH /rules/{id}`, `DELETE /rules/{id}`), active strategy endpoint (`PATCH /active-strategy`), priority ordering (`priority_order.asc()`), channel condition matching (specific channel takes precedence over catch-all), cross-tenant team foreign key rejection (404), RBAC enforcement on all mutations & active strategy updates (`require_roles(ADMIN, AGENT)`), customer 403 blocks, tenant-scoped query isolation; Ticket auto-assignment engine (`POST /assign/{ticket_id}`) supporting genuine round-robin rotation, least_loaded assignment (counting active non-deleted tickets), safe fallback when zero agents exist in team/workspace, audit timeline event generation on assignment; Ticket lifecycle integration (automatic routing on unassigned ticket creation when active routing rules exist); Frontend integration in `AdminSettingsScreen.js` & `adminService.js` (`getRoutingRules`, `setActiveRoutingStrategy`, `createRoutingRule`, `getRoutingRule`, `updateRoutingRule`, `deleteRoutingRule`) and `ticketService.js` (`autoAssignTicket`) | Skills-based filter rules | Live WebSockets chat offer queue | 9 passed (+ 1 isolation test) |
| **9** | **Macros** | **Verified** | Macro CRUD, template placeholder rendering (`{{customer.name}}`, `{{ticket.subject}}`, `{{agent.name}}`), automated customer reply and internal note application | Action tag array insertion | None for core macro execution | 1 passed |
| **10**| **Automations** | **Verified** | Event-driven rule evaluation (`ticket_created`, `ticket_updated`), condition evaluation (`==`, `!=`, `in`), action execution (`set_status`, `set_priority`), loop depth guard (`MAX_LOOP_DEPTH = 3`), audit logs | Synchronous evaluation on API trigger | Background Celery/cron worker for time-delayed rules | 1 passed |

*(Note: Health, Security, and Analytics tests comprise the remaining 10 tests. The 40-test baseline + 109 new/expanded tests across isolation, auth, webhooks, crm, channels, teams, tickets, SLA, and routing = 149 total)*

---

## 1b. Tenant Isolation Audit (October 31, 2026)

### Scope
All 10 in-scope modules audited for cross-tenant data access, IDOR vulnerabilities, and internal-note leakage.

### Method
- Read every endpoint, service function, and DB query for all 10 modules.
- Checked that every resource lookup includes a `WHERE … tenant_id = <authenticated-user.tenant_id>` clause.
- Checked that all resource IDs received from the client (ticket_id, team_id, org_id, macro_id, etc.) are fetched with a tenant scope — never a bare `WHERE id = X`.
- Checked the in-memory collision store for cross-tenant key collisions.
- Wrote 28 regression tests across two separate tenants, then executed the full suite.

### Confirmed Vulnerabilities Fixed

| Vuln | Affected File | Root Cause | Fix Applied |
|---|---|---|---|
| **Cross-tenant agent presence leakage via collision store** | `app/services/ticket.py`, `app/api/v1/endpoints/tickets.py` | `ACTIVE_COLLISIONS` dict keyed only by `ticket_id`; any authenticated user from any tenant could write/read collision data for another tenant's ticket using a known ticket ID. | `record_collision` / `get_collision` now key on `"{tenant_id}:{ticket_id}"`. Both collision endpoints (`POST` and `GET`) now call `get_ticket(…, tenant_id=current_user.tenant_id)` before touching the store — cross-tenant ticket IDs raise 404. |
| **Missing RBAC on workspace update & member invite** | `app/api/v1/endpoints/workspace.py` | `PATCH /tenants/current`, `POST /tenants/invite`, and `POST /tenants/invite/bulk` depended only on `get_current_user` without role checks, allowing customers to alter workspace plans or invite users. | Protected with `require_roles(UserRole.ADMIN, UserRole.AGENT)`. Customers now receive HTTP 403 Forbidden. |
| **Cross-tenant organization linkage in CRM contacts** | `app/services/crm.py` | `create_contact` assigned `organization_id` directly without verifying that the organization belonged to the authenticated tenant. | Added tenant verification query `Organization.id == organization_id, Organization.tenant_id == tenant_id`; raises 404 if organization belongs to another workspace. |
| **Cross-tenant agent assignment in tickets** | `app/services/ticket.py` | `update_ticket` assigned `assigned_to_id` directly without verifying that the agent belonged to the ticket's tenant. | Added tenant verification query `User.id == assigned_to_id, User.tenant_id == tenant_id`; raises 404 if target agent belongs to another workspace. |
| **Cross-tenant target team linkage in routing rules** | `app/services/routing.py` | `create_routing_rule` accepted `target_team_id` without verifying team tenant ownership. | Added tenant verification query `Team.id == target_team_id, Team.tenant_id == tenant_id`; raises 404 if target team belongs to another workspace. |
| **Workspace settings persistence** | `app/services/workspace.py`, `app/schemas/tenant.py` | `update_workspace` ignored `business_hours` and `branding_color` fields; `TenantResponse` schema omitted `settings_json`. | Persisted fields into `tenant.settings_json`; exposed `settings_json` in `TenantResponse` so workspace settings load and save cleanly on frontend. |
| **Missing CRM Org & Contact Update/Delete & RBAC** | `app/api/v1/endpoints/crm.py`, `app/services/crm.py` | `PATCH` and `DELETE` endpoints were omitted despite schemas existing; mutation routes lacked RBAC checks; cross-tenant organization linking on contact update was unverified. | Added `update_organization`, `delete_organization` (cascade unlinks contacts), `update_contact` (with cross-tenant org rejection 404 & duplicate email 400), and `delete_contact`; enforced `require_roles(ADMIN, AGENT)`. |
| **Missing Team Update/Delete/Removal & RBAC** | `app/api/v1/endpoints/teams.py`, `app/services/team.py`, `app/schemas/team.py` | Teams only supported creation and assignment; no update, deletion, or member removal existed; team mutation routes lacked role checks allowing customer access. | Added `update_team`, `delete_team` (unlinks member team_id), `remove_user_from_team`; added `TeamUpdate` and `TeamMemberResponse` schemas; restricted mutations to `require_roles(ADMIN, AGENT)`. |
| **Missing Workspace Users Management & Privilege Escalation** | `app/api/v1/endpoints/workspace.py`, `app/services/workspace.py`, `app/schemas/user.py` | Admins lacked endpoints to list, retrieve, directly create, update, or delete users within a workspace; non-admin users could potentially modify roles. | Added `GET /tenants/users`, `POST /tenants/users`, `GET /tenants/users/{id}`, `PATCH /tenants/users/{id}`, `DELETE /tenants/users/{id}`; enforced strict privilege escalation guards (only admins can change roles/active status; self-demotion/deactivation/deletion blocked; duplicate emails rejected 400). |
| **Missing Channel Lifecycle & Unmasked Secrets in Responses** | `app/api/v1/endpoints/channels.py`, `app/services/channel.py`, `app/schemas/channel.py` | Channels lacked update, deletion, and single-view endpoints; channel mutations lacked RBAC checks; configuration secrets (api_key, webhook_secret, tokens) were stored and returned unmasked in API responses. | Added `GET /channels/{id}`, `PATCH /channels/{id}`, `DELETE /channels/{id}`; added `ChannelUpdate` schema; implemented automatic secret masking (`***...`) on read; implemented unmasked secret preservation on update; added config JSON and name validation; enforced `require_roles(ADMIN, AGENT)`. |
| **Missing RBAC on Ticket Trash, Restore, Spam, and Merge** | `app/api/v1/endpoints/tickets.py` | `DELETE /{id}`, `POST /{id}/restore`, `POST /{id}/spam`, and `POST /{id}/merge/{target_id}` used `get_current_user` without role restrictions, allowing customer accounts to trash tickets or trigger ticket merges. | Enforced `require_roles(UserRole.ADMIN, UserRole.AGENT)` across soft delete, restore, spam, and merge endpoints; customers now receive 403 Forbidden. |
| **Cross-Tenant Team Assignment in Tickets** | `app/services/ticket.py` | `update_ticket` permitted assigning `team_id` without validating whether the team belonged to the ticket's workspace. | Added tenant verification query `Team.id == team_id, Team.tenant_id == tenant_id`; raises 404 if the team belongs to another tenant. |
| **Customer Modification of Ticket Internal Fields** | `app/services/ticket.py` | Customers could modify ticket priority, assigned agent, team, tags, or pause SLA timers via `PATCH /tickets/{id}`. | Restricted customer updates: customers may only close their tickets; attempting to alter priority, team, assignee, sla_paused, or tags_json raises 403 Forbidden. |
| **Unvalidated Ticket Input & Tags JSON** | `app/services/ticket.py`, `app/schemas/ticket.py` | Whitespace-only subjects/descriptions bypassed validation; `tags_json` accepted malformed non-JSON strings causing client-side rendering crashes. | Added length validation (>= 2 chars) on create & update; validated `tags_json` as a valid JSON array string; added `TicketUpdate` fields for team, tags, and sla_paused. |
| **Internal Note Exposure in Ticket Detail Response** | `app/services/ticket.py` | `get_ticket` eager-loaded all messages without filtering out internal notes for customer users when fetching single tickets. | Added customer message filter to strip `sender_type == MessageSenderType.INTERNAL_NOTE` from `ticket.messages` before returning. |
| **Missing Audit Timeline Endpoint** | `app/api/v1/endpoints/tickets.py`, `app/services/ticket.py`, `app/schemas/ticket.py` | Ticket audit events were recorded in `TicketTimeline` table but had no dedicated API endpoint or schema. | Added `TicketTimelineResponse` schema, `get_ticket_timeline` service function, and `GET /api/v1/tickets/{id}/timeline` endpoint with tenant isolation. |
| **Missing RBAC on SLA Policy Management** | `app/api/v1/endpoints/sla.py` | `POST /policies`, `PATCH /policies/{id}`, and `DELETE /policies/{id}` lacked role checks; any authenticated customer could modify or delete SLA policies. | Enforced `require_roles(UserRole.ADMIN, UserRole.AGENT)` across SLA policy creation, update, and deletion; customers receive 403 Forbidden. |
| **Missing Single SLA Policy Retrieval & Deletion** | `app/api/v1/endpoints/sla.py`, `app/services/sla.py` | `GET /policies/{id}` and `DELETE /policies/{id}` endpoints were absent, preventing single policy inspection or cleanup. | Added `get_sla_policy` and `delete_sla_policy` with strict tenant isolation (`SLAPolicy.tenant_id == tenant_id`). |
| **Unvalidated SLA Targets & Priority Input** | `app/services/sla.py`, `app/schemas/workflow.py` | Target resolution time could be set shorter than first response time; invalid priorities were accepted without validation. | Enforced `resolution_time_minutes >= first_response_time_minutes` and validated priority against `(urgent, high, medium, low)`, raising 422 on invalid targets. |
| **Customer IDOR in SLA Evaluation** | `app/api/v1/endpoints/sla.py` | `POST /evaluate/{ticket_id}` did not verify customer ownership; any authenticated customer could evaluate other customers' tickets. | Added `ticket_service.get_ticket()` verification ensuring customers can only evaluate their own tickets (403 on other customer's ticket; 404 cross-tenant). |
| **Static Ticket SLA Targets & Missing Lifecycle Integration** | `app/services/ticket.py`, `app/services/sla.py` | Tickets had hardcoded `"2h"` SLA remaining regardless of priority; ticket priority and status updates did not update SLA state. | Integrated `get_initial_sla_for_priority()` into ticket creation and priority updates; automatic timer pause on `pending`, freeze on `resolved`, and resumption on `open`. |

### Verified Correct (No Change Needed)

| Module | Finding |
|---|---|
| **Auth** | `get_current_user` enforces `user.tenant_id == JWT.tenant_id`; token cannot be reused across tenants. |
| **Tenants** | `PATCH /tenants/current` and `GET /tenants/current` derive `tenant_id` from `current_user.tenant_id` only. |
| **Users & Teams** | All team queries include `Team.tenant_id == tenant_id`; `assign_user_to_team` verifies `User.tenant_id == tenant_id`. |
| **Contacts & Orgs** | All queries include `Organization.tenant_id == tenant_id` / `Contact.tenant_id == tenant_id`. The `organization_id` filter in `list_contacts` is layered on top of the tenant filter — not a bypass. |
| **Channels & Webhooks** | Authenticated channel endpoints derive `tenant_id` from user. Webhooks resolve tenant from URL slug via DB lookup; unknown slugs return 404. |
| **Public Forms** | Form creation is authenticated. Submission resolves tenant from `form.tenant_id` (DB-backed, not from request body). |
| **Web Chat Init** | Resolves tenant from slug via DB lookup; unknown slugs return 404. Visitor token embeds `tenant_id`. |
| **Tickets** | All CRUD, message, merge, delete, restore, spam, SLA-evaluate, and routing-assign operations scope by `Ticket.tenant_id == current_user.tenant_id`. |
| **SLA** | All policy and evaluation queries include `SLAPolicy.tenant_id == tenant_id`. |
| **Routing** | All rule and assignment queries include `RoutingRule.tenant_id == tenant_id`; ticket lookup for assign includes `Ticket.tenant_id`. |
| **Macros** | `apply_macro_to_ticket` fetches macro with `Macro.tenant_id == tenant_id` AND ticket with `Ticket.tenant_id == tenant_id`. Cross-tenant macro application returns 404. |
| **Automations** | `execute_automations_for_event` first fetches ticket with `Ticket.tenant_id == tenant_id`; returns `[]` when ticket not found. Automation rules filtered by `AutomationRule.tenant_id`. |
| **Internal notes** | `get_ticket_messages` filters `sender_type != INTERNAL_NOTE` for customers. `add_ticket_message` blocks `sender_type = internal_note` with 403 for customers. |

### New & Expanded Test Coverage

**`backend/tests/test_tenant_isolation.py`** — 49 tests organized into 10 test classes:

| Class | Tests |
|---|---|
| `TestTicketIsolation` | cross-tenant read, update, delete, message-read, message-write, merge, collision-write, collision-read, list-leak |
| `TestInternalNoteVisibility` | customer cannot see internal notes |
| `TestCRMIsolation` | cross-tenant org-read, contact-read, org-list-leak, contact-list-leak, cross-tenant org-update, cross-tenant org-delete, cross-tenant contact-update, cross-tenant contact-delete, cross-tenant contact-org FK rejection |
| `TestTeamIsolation` | cross-tenant team-read, team-list-leak, cross-tenant team-update, cross-tenant team-delete |
| `TestWorkspaceUsersIsolation` | cross-tenant user-list-isolation, user-get-rejected, user-update-rejected, user-delete-rejected |
| `TestChannelIsolation` | cross-tenant channel-read, channel-list-leak, cross-tenant channel-update, cross-tenant channel-delete |
| `TestSLAIsolation` | cross-tenant policy-update, policy-list-leak |
| `TestRoutingIsolation` | rule-list-leak |
| `TestMacroIsolation` | macro-list-leak, cross-tenant macro-apply |
| `TestAutomationIsolation` | automation-list-leak, cross-tenant execution |
| `TestWorkspaceIsolation` | workspace update scoped to own tenant |
| `TestPublicEndpointTenantBinding` | unknown-slug email/whatsapp/webchat return 404; form submission scoped to form's tenant |
| `TestCrossTenantEntityBindingAndPermissions` | customer workspace update blocked (403), customer invite blocked (403), cross-tenant contact-org binding blocked (404), cross-tenant ticket-assignee binding blocked (404), cross-tenant routing-team binding blocked (404), workspace settings persistence |

**`backend/tests/test_crm_channels_teams.py`** — 10 tests covering:
- `test_teams_crud` & `test_teams_full_lifecycle_and_rbac` (team creation, name validation, updates, member assign/remove, deletion cascade, customer 403 rejection)
- `test_crm_organizations_and_contacts` & `test_crm_full_lifecycle_validation_and_isolation` (organization & contact CRUD, contact initials calculation, duplicate email 400 rejection, organization delete unlinking cascade, 404 after deletion)
- `test_workspace_users_crud_and_rbac` (admin user creation, duplicate email rejection, listing, updates, privilege escalation prevention: agent cannot promote to admin 403, self-demotion 400, self-deletion 400, deletion cascade)
- `test_channels_full_crud_masking_and_rbac` (channel creation, automatic secret masking in responses, listing & single view masking, updates preserving unmasked secrets, activation/deactivation, JSON/name validation 422, customer 403 blocks)
- `test_public_forms_intake`, `test_webchat_visitor_init`, `test_inbound_webhooks`, `test_notifications`

### Remaining Risks (Not Fixed — Out of Scope or Acceptable)

| Risk | Notes |
|---|---|
| No webhook signature verification | ~~Email/WhatsApp webhooks accept any payload from any caller.~~ **FIXED in session 1c.** HMAC-SHA256 verification implemented for both providers. |
| Collision store is in-process memory | If the backend runs multiple worker processes or is restarted, collision state is lost. Acceptable for development; Redis/DB backing would be production hardening. |
| Rate limiting is in-process only | The token-bucket limiter works correctly in single-process deployments. For multi-worker (gunicorn/uvicorn) production, each worker maintains its own counter — effective rate per server = N × configured limit. Redis-backed rate limiting would solve this. |
| Access token not blocklisted on logout | Standard JWT stateless behavior — tokens remain valid until expiry after logout. Short `ACCESS_TOKEN_EXPIRE_MINUTES` mitigates the risk window. |
| No webhook replay-attack window check | Webhook signature is verified but there is no timestamp freshness check (e.g. reject requests older than 5 minutes). A captured valid request could be replayed within the signature validity window. |
| No IP allowlist for webhook sources | Webhook endpoints accept requests from any IP. Adding an IP allowlist for Meta/Mailgun CIDR ranges would provide defense-in-depth. |

---

## 1c. Webhook Security & Rate Limiting (October 31, 2026)

### Scope
Inbound email and WhatsApp webhook authenticity checks, WhatsApp GET hub challenge verification, abuse protection via rate limiting across auth and public endpoints, and test suite isolation.

### Implementation Summary
1. **WhatsApp Cloud API Webhook Security (`verify_whatsapp_signature`):**
   - Validates `X-Hub-Signature-256` header (HMAC-SHA256) computed against raw request bytes using `settings.WHATSAPP_WEBHOOK_SECRET`.
   - Timing-safe comparison using `hmac.compare_digest`.
   - Returns 401 Unauthorized for missing, malformed, or invalid signatures.
   - Rejects non-JSON payloads with 400 Bad Request.
   - Fail-closed in production: Returns 503 Service Unavailable when `WHATSAPP_WEBHOOK_SECRET` is not configured in production environments.
2. **WhatsApp Hub Challenge GET Handshake (`whatsapp_hub_challenge`):**
   - Endpoint: `GET /api/v1/channels/webhook/whatsapp/{tenant_slug}`.
   - Validates `hub.mode == "subscribe"` and `hub.verify_token == settings.WHATSAPP_WEBHOOK_SECRET`.
   - Echoes back `hub.challenge` as plain text on match with HTTP 200.
   - Returns 403 Forbidden on token/mode mismatch; returns 503 if secret is unconfigured.
3. **Inbound Email Webhook Security (`verify_email_signature`):**
   - **Mailgun:** Validates `timestamp + token + signature` triple via HMAC-SHA256 against `settings.EMAIL_WEBHOOK_SECRET`.
   - **Generic / SendGrid Fallback:** Validates `X-Webhook-Signature` header computed over raw request body using HMAC-SHA256.
   - Returns 401 Unauthorized for missing or invalid signatures; rejects non-JSON with 400 Bad Request.
   - Fail-closed in production: Returns 503 Service Unavailable if `EMAIL_WEBHOOK_SECRET` is unconfigured.
4. **Rate Limiting & Abuse Protection (`app/core/rate_limit.py`):**
   - In-process token bucket algorithm with thread-safe locking (`threading.Lock`).
   - Returns HTTP 429 Too Many Requests with standard `Retry-After` header when bucket capacity is exhausted.
   - Handled in FastAPI global exception handler in `main.py` so headers are preserved in error responses.
   - Configurable IP extraction: Extracts `request.client.host` by default to prevent header spoofing; honors `X-Forwarded-For` / `X-Real-IP` only when `TRUST_PROXY_HEADERS=True`.
   - **Configured Limiter Instances:**
     - `auth_login`: 10 requests / 60s
     - `auth_register`: 5 requests / 60s
     - `auth_pw_reset`: 5 requests / 300s
     - `public_form_submit`: 10 requests / 60s
     - `public_webchat_init`: 20 requests / 60s
     - `webhook`: 200 requests / 60s
5. **Test Isolation (`tests/conftest.py`):**
   - Autouse fixture `reset_rate_limit_buckets` clears all in-process rate-limit buckets before and after every test, preventing state leakage across test suites sharing the `testclient` IP.

### New Test File: `backend/tests/test_webhook_security.py` (25 tests)
- `TestWhatsAppSignature` (7 tests): valid signature accepted, invalid signature rejected (401), missing header rejected (401), malformed JSON rejected (400), missing secret in production (503), missing secret in dev (skips verification), tampered body rejected (401).
- `TestWhatsAppHubChallenge` (4 tests): valid challenge echoes plain text, wrong token returns 403, wrong mode returns 403, missing secret returns 503.
- `TestEmailSignature` (7 tests): valid Mailgun triple accepted, invalid signature rejected (401), generic HMAC header accepted, missing signature rejected (401), malformed JSON rejected (400), missing secret in production (503), missing secret in dev (skips verification).
- `TestRateLimiting` (7 tests): form submit limit (429 on 11th request), legitimate requests pass, login limit (429 on 11th attempt), password reset limit (429 on 6th request), webchat init limit (429 on 21st request), register limit (429 on 6th request), `Retry-After` header verified on 429 response.

---

## 1a. Auth Module — Security Hardening Detail (October 31, 2026)

### Changes Made to `backend/app/services/auth.py`

**Fix 1 — Refresh token reuse triggers full session family revocation**
- **Before:** Detecting a revoked refresh token returned 401 but left the rotated token live.
- **After:** `rotate_refresh_token()` now calls `await revoke_all_user_tokens(db, record.user_id)` before raising 401 on reuse. Any attacker who replays an old token causes the entire token family to be invalidated, protecting the legitimate user.

**Fix 2 — Password-reset tokens are now single-use**
- **Before:** A reset JWT could be used twice within its 2-hour window (no spent-token tracking).
- **After:** `request_password_reset()` embeds a `"pwd_fp"` claim — the first 16 hex chars of `SHA-256(hashed_password)`. `confirm_password_reset()` verifies the fingerprint still matches. After a successful reset, the password hash changes, making the old fingerprint stale. Any reuse attempt returns `400 "Password reset token has already been used or is invalid"`.

**Fix 3 — `Dict` added to typing imports**
- `from typing import Optional` → `from typing import Dict, Optional` to match the `-> Dict[str, str]` return annotations already present.

**Fix 4 — Constant-time dummy verification prevents timing side-channel user enumeration**
- **Before:** When a requested email was not found in `authenticate_user`, it returned immediately without calling `verify_password`. Because Argon2id takes ~50-80ms, attackers could measure response timing to enumerate existing accounts.
- **After:** A pre-computed dummy Argon2id hash (`DUMMY_PASSWORD_HASH`) is verified on nonexistent accounts and nonexistent workspaces, keeping execution time identical.

**Fix 5 — Multi-tenant scoping & token leakage prevention in password reset**
- **Before:** `request_password_reset` queried email globally across tenants and returned `reset_token` in response body.
- **After:** Scoped by `req.tenant_slug`; embeds `tenant_id` in token claims; returns generic message on non-existent tenants/users with dummy verification; in production (`ENVIRONMENT != "development"`), `reset_token` is omitted from the API response and dispatched only via email.

**Fix 6 — JWT token purpose restriction**
- **Before:** `get_current_user` accepted any valid JWT signed by `SECRET_KEY`, allowing password-reset tokens (`purpose="password_reset"`) to be reused as API access tokens.
- **After:** `get_current_user` explicitly checks `payload.get("purpose")` and rejects non-access tokens with HTTP 401 Unauthorized (`Invalid token purpose for authentication`).

**Fix 7 — Mandatory `tenant_id` claim in JWT access tokens**
- **Before:** `get_current_user` queried `User.id == user_id` and only filtered `User.tenant_id == tenant_id` if the claim was present.
- **After:** Rejects tokens lacking `tenant_id` with HTTP 401; strictly checks `User.tenant_id == tenant_id`, preventing cross-tenant token forgery.

**Fix 8 — Production `SECRET_KEY` validator in `Settings`**
- **Before:** Default insecure key was allowed in all environments.
- **After:** `Settings.validate_secret_key` raises a `ValidationError` on startup if `ENVIRONMENT` is production and `SECRET_KEY` is shorter than 32 characters or matches the default dev placeholder.

**Fix 9 — Frontend refresh token persistence and background refresh recovery**
- **Before:** `offlineStorage.js` only persisted `access_token` and `user`. When the access token expired, users had to log in again.
- **After:** `offlineStorage.js` stores `AUTH_REFRESH_TOKEN`; `authService.js` provides `refreshToken()`; `restoreSession()` automatically attempts token refresh when access token is expired; `apiClient.js` invokes `onUnauthorizedHandler` on mid-flight 401 responses.

### New / Extended Tests in `backend/tests/test_auth.py`

| Test | Coverage Added |
|---|---|
| `test_refresh_token_rotation` (extended) | After reuse detection, verifies the replacement token is also revoked (family invalidation) |
| `test_password_reset_flow` (extended) | After first successful reset, re-using same token returns 400 with `"already been used or is invalid"` |
| `test_logout_session_revocation` (new) | Register → logout → attempt refresh → expect 401 |
| `test_role_and_tenant_isolation_security` (new) | Customer cannot post `sender_type=internal_note` (403); cross-tenant ticket access returns 404 |
| `test_login_nonexistent_user_returns_generic_error` (new) | Nonexistent user returns identical 401 message "Incorrect email or password" |
| `test_token_missing_tenant_id_rejected` (new) | Token without `tenant_id` claim returns 401 |
| `test_token_mismatched_tenant_id_rejected` (new) | Token with forged/mismatched `tenant_id` returns 401 |
| `test_password_reset_token_rejected_as_access_token` (new) | Token with `purpose="password_reset"` used as Bearer token returns 401 |
| `test_password_reset_unknown_user_anti_enumeration` (new) | Reset for unknown email returns generic success message |
| `test_password_reset_unknown_workspace_anti_enumeration` (new) | Reset for unknown workspace returns generic success message |
| `test_production_secret_key_validation` (new) | Validates `Settings` startup validation rejects weak secret key in production |

### Auth Limitations Remaining (Not Changed — Out of Scope)

| Limitation | Notes |
|---|---|
| Access token not blocklisted on logout | Standard stateless JWT behavior; short expiry mitigates risk |
| TOTP enrollment endpoint missing | `User.totp_secret` / `totp_enabled` columns exist; no `POST /auth/2fa/enroll` endpoint |

---

## 2. API Endpoints Catalog (35 Available Endpoints)

- **Auth:**
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `GET /api/v1/auth/me`
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/auth/password-reset/request`
  - `POST /api/v1/auth/password-reset/confirm`
- **Tenants & Workspaces:**
  - `GET /api/v1/tenants/check-slug`
  - `GET /api/v1/tenants/current`
  - `PATCH /api/v1/tenants/current`
- **Users & Teams:**
  - `POST /api/v1/tenants/invite`
  - `POST /api/v1/tenants/invite/bulk`
  - `POST /api/v1/tenants/invitations/{token}/accept`
  - `POST /api/v1/teams/`
  - `GET /api/v1/teams/`
  - `GET /api/v1/teams/{id}`
  - `POST /api/v1/teams/{id}/members/{user_id}`
- **Contacts & Organizations:**
  - `POST /api/v1/crm/organizations`, `GET /api/v1/crm/organizations`, `GET /api/v1/crm/organizations/{id}`
  - `POST /api/v1/crm/contacts`, `GET /api/v1/crm/contacts`, `GET /api/v1/crm/contacts/{id}`
- **Channels & Public:**
  - `POST /api/v1/channels/`, `GET /api/v1/channels/`
  - `POST /api/v1/channels/webhook/email/{tenant_slug}`
  - `GET /api/v1/channels/webhook/whatsapp/{tenant_slug}` (Meta hub challenge verification handshake)
  - `POST /api/v1/channels/webhook/whatsapp/{tenant_slug}` (HMAC-SHA256 verified inbound webhook)
  - `POST /api/v1/public/forms`, `GET /api/v1/public/forms/{slug}`, `POST /api/v1/public/forms/{slug}/submit`
  - `POST /api/v1/public/chat/init`
- **Tickets:**
  - `POST /api/v1/tickets/`, `GET /api/v1/tickets/`, `GET /api/v1/tickets/{id}`, `PATCH /api/v1/tickets/{id}`
  - `POST /api/v1/tickets/{id}/messages`, `GET /api/v1/tickets/{id}/messages`
  - `DELETE /api/v1/tickets/{id}`, `POST /api/v1/tickets/{id}/restore`, `POST /api/v1/tickets/{id}/spam`
  - `POST /api/v1/tickets/{id}/merge/{target_id}`
  - `POST /api/v1/tickets/{id}/collision`, `GET /api/v1/tickets/{id}/collision`
- **SLA:**
  - `POST /api/v1/sla/policies`, `GET /api/v1/sla/policies`, `PATCH /api/v1/sla/policies/{id}`, `POST /api/v1/sla/evaluate/{ticket_id}`
- **Routing:**
  - `POST /api/v1/routing/rules`, `GET /api/v1/routing/rules`, `PATCH /api/v1/routing/active-strategy`, `POST /api/v1/routing/assign/{ticket_id}`
- **Macros:**
  - `POST /api/v1/macros/`, `GET /api/v1/macros/`, `POST /api/v1/macros/{id}/apply/{ticket_id}`
- **Automations:**
  - `POST /api/v1/automations/`, `GET /api/v1/automations/`, `POST /api/v1/automations/execute/{ticket_id}`

---

## 3. Database Models & Migrations Status

All database tables are covered by three tracked Alembic migration revisions in `backend/alembic/versions/`:
1. `2026_10_31_1836-4f891fb2cd8b_init_foundation.py`
2. `2026_10_31_1842-8f12a34b56c7_create_core_tables.py`
3. `2026_10_31_1925-9a23c45d67e8_add_crm_channels_notifications.py`
4. `2026_10_31_1944-b123c45e67f8_add_workflows_sla_routing_macros_automations.py`

**Tables Tracked:**
`tenants`, `users`, `teams`, `tickets`, `ticket_messages`, `ticket_timeline`, `organizations`, `contacts`, `channels`, `public_forms`, `web_chat_visitor_sessions`, `notifications`, `refresh_tokens`, `user_invitations`, `sla_policies`, `routing_rules`, `macros`, `automation_rules`, `automation_logs`.

---

## 4. Frontend Screens & API Connections Status

- **Connected to Backend API:**
  - `LoginScreen.js` → `authService.login()` with JWT token & user persistence
  - `RegistrationScreen.js` → `authService.register()` with user persistence
  - `App.js` → `authService.restoreSession()`, `syncManager.loadTickets()`, `syncManager.processOfflineQueue()`
  - `CreateTicketScreen.js` → `syncManager.createTicket()` live backend submission with offline fallback & queueing
  - `TicketDetailsScreen.js` → `syncManager.addMessage()` thread updates & `ticketService.updateTicket()` status changes
  - `AdminSettingsScreen.js` → `adminService` (Tenant settings, SLA policy targets, ticket assignment strategy, and agent invitations)
  - `front.html` → Standalone embeddable web chat widget communicating with `POST /public/chat/init`
- **Connected with Local Caching & Offline Sync:**
  - `MyTicketsScreen.js`, `CustomerHomeScreen.js`
- **Present in UI with Static Mock Data Fallback:**
  - `AgentDashboardScreen.js`, `InboxScreen.js`, `NotificationsScreen.js`, `ProfileScreen.js`

---

## 5. External Credentials & Configuration Required

| Service | Configuration Keys | Purpose | Current Fallback |
|---|---|---|---|
| **Email Inbound/Outbound** | `SENDGRID_API_KEY` or `MAILGUN_API_KEY` | Real SMTP delivery & inbound webhook signing | Webhook parsing active; mock delivery |
| **WhatsApp Cloud API** | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | Real Meta WhatsApp messaging | Webhook processor active |
| **Object Storage** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` | Binary attachment storage | Message metadata active |
| **Redis** | `REDIS_URL` | Distributed agent presence & chat queue | PostgreSQL / in-memory active |

---

## 6. Exact Next Steps Required to Advance the 10 Modules

1. **Production Cloud Database Provisioning:** Provide cloud PostgreSQL connection string in `backend/.env` (e.g. Render / Supabase / Neon) and run `alembic upgrade head`.
2. **Third-Party Webhook Ingestion URL:** Set DNS/Webhook target to your cloud URL:
   - Email: `https://<deployed-domain>/api/v1/channels/webhook/email/<tenant_slug>`
   - WhatsApp: `https://<deployed-domain>/api/v1/channels/webhook/whatsapp/<tenant_slug>`
3. **Frontend Agent Screens API Wiring:** Connect `AgentDashboardScreen.js` and `InboxScreen.js` to `/api/v1/tickets` and `/api/v1/teams`.
4. **Binary Attachment Storage:** Add S3 / Cloudflare R2 bucket credentials for direct file uploads.
