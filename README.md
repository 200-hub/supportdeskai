# SupportDesk AI

A multi-tenant customer-support platform: a **React Native (Expo) app** for customers, agents and admins, backed by a **Python FastAPI + PostgreSQL** API. Tickets can come in from the app, email (Mailgun), WhatsApp (Meta Cloud API), a web chat widget and public web forms, and are handled with SLAs, routing, macros, automations, a knowledge base and an AI assistant.

> This README describes the **`masiatun`** branch.

---

## Contents

1. [What's in this repo](#1-whats-in-this-repo)
2. [Prerequisites](#2-prerequisites)
3. [Quick start](#3-quick-start)
4. [Running the backend](#4-running-the-backend)
5. [Running the frontend (app)](#5-running-the-frontend-app)
6. [Test accounts](#6-test-accounts)
7. [Running the tests](#7-running-the-tests)
8. [Configuration reference](#8-configuration-reference)
9. [API overview](#9-api-overview)
10. [Deployment](#10-deployment)
11. [Security model](#11-security-model)
12. [Troubleshooting](#12-troubleshooting)
13. [Known limitations](#13-known-limitations)

---

## 1. What's in this repo

| Part | Tech | Location |
|---|---|---|
| Mobile / web app | Expo SDK 58, React Native 0.88, React 19 | `App.js`, `src/` |
| Backend API | Python 3.12+, FastAPI, SQLAlchemy 2 (async), Pydantic v2 | `backend/app/` |
| Database | PostgreSQL 16, Alembic migrations | `backend/alembic/` |
| Auth | Argon2id password hashing, JWT access token (1 h) + rotating refresh token (30 days) | `backend/app/core/security.py` |
| Web chat widget | Standalone HTML page | `front.html` |
| Local infrastructure | Docker Compose (Postgres + optional API container) | `docker-compose.yml` |

```text
supportdeskai/
├── App.js                      # App root: auth flow, tabs, overlays
├── index.js                    # Expo entry point
├── app.json                    # Expo config (name, icons, plugins)
├── src/
│   ├── screens/                # Welcome, Login, Register, Customer home, Agent dashboard, Inbox, Ticket details, AI chat, ...
│   ├── components/             # Shared UI (buttons, inputs, badges, tab bars, ticket card)
│   ├── services/               # apiClient, authService, syncManager (offline queue), offlineStorage, ...
│   ├── hooks/useTopInset.js    # Safe status-bar inset on Android
│   ├── data/mockData.js        # Demo data shown before/without the backend
│   └── theme/                  # Colors, typography, spacing
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, error handlers
│   │   ├── api/v1/             # Routers (auth, tickets, crm, channels, sla, ...)
│   │   ├── core/               # config, security, rate limiting, webhook signatures, mailer
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic request/response models
│   │   └── services/           # Business logic
│   ├── alembic/versions/       # Database migrations
│   ├── scripts/seed_demo_accounts.py
│   ├── tests/                  # 172 pytest tests
│   ├── .env.example
│   ├── Dockerfile, render.yaml, railway.toml
│   └── requirements.txt
├── docker-compose.yml
└── IMPLEMENTATION_STATUS.md    # Module-by-module implementation notes
```

---

## 2. Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| **Python** | 3.12 or newer (tested on 3.13) | Backend |
| **Node.js + npm** | Current LTS or newer (tested on Node 26 / npm 11) | Frontend |
| **Docker Desktop** | Any recent version | Running PostgreSQL locally (or install PostgreSQL 16 yourself) |
| **Expo Go** app | Latest, from the App Store / Play Store | Optional: running the app on a real phone |
| Android Studio emulator / Xcode simulator | — | Optional |

---

## 3. Quick start

Windows PowerShell, from the repo root. macOS/Linux differences are noted in sections 4 and 5.

```powershell
# 1. Database
docker compose up -d db

# 2. Backend (terminal 1)
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Test accounts (terminal 2, backend running)
cd backend
.\.venv\Scripts\Activate.ps1
python scripts/seed_demo_accounts.py

# 4. App (terminal 3, repo root)
npm install
npx expo start --web            # opens http://localhost:8081 in the browser
```

Then sign in with one of the [test accounts](#6-test-accounts).

---

## 4. Running the backend

All backend commands run from the **`backend/`** folder, because settings are read from `backend/.env`.

### 4.1 Start PostgreSQL

The easiest way is Docker. From the repo root:

```powershell
docker compose up -d db
```

This starts `postgres:16-alpine` on `localhost:5432` with:

| Setting | Value |
|---|---|
| User | `supportdesk` |
| Password | `supportdesk_password` |
| Database | `supportdesk_db` |

These match the backend's built-in defaults, so **no `.env` is needed for local development**.

To use your own PostgreSQL instead, create a `backend/.env` that points at it (see 4.3).

### 4.2 Install Python dependencies

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

### 4.3 (Optional) Create `backend/.env`

The defaults work for local development: development mode, debug off, a dev-only secret key and the Docker Postgres above. Create a `.env` only to change something:

```ini
# backend/.env — local development example
ENVIRONMENT=development
DEBUG=True                       # shows real error messages and logs SQL
SECRET_KEY=any-local-dev-value
# DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname   # overrides POSTGRES_* below
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=supportdesk
POSTGRES_PASSWORD=supportdesk_password
POSTGRES_DB=supportdesk_db
```

> ⚠️ `backend/.env.example` is a **production** template (`ENVIRONMENT=production`). If you copy it for local work, change `ENVIRONMENT` to `development`. In production mode the API refuses to start with a weak `SECRET_KEY`, webhooks return 503 until their secrets are set, and password-reset tokens are only sent by email.

Never commit `.env`; it is already in `backend/.gitignore`.

### 4.4 Create or upgrade the database tables

```powershell
alembic upgrade head
```

Run this after every pull that adds a migration. Other useful commands:

```powershell
alembic current                      # which migration the DB is on
alembic downgrade -1                 # roll back one migration
alembic revision --autogenerate -m "describe change"   # after editing models
```

### 4.5 Start the API

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

`--host 0.0.0.0` makes the API reachable from phones and emulators on your network, and `--reload` restarts the server when code changes.

| URL | What |
|---|---|
| http://localhost:8000/health | Health check |
| http://localhost:8000/api/v1/docs | **Swagger UI**: try every endpoint in the browser |
| http://localhost:8000/api/v1/redoc | ReDoc API reference |

### 4.6 Alternative: everything in Docker

```powershell
docker compose up -d --build                      # Postgres + API container on :8000
docker compose exec backend alembic upgrade head  # create tables (first run / after new migrations)
docker compose exec backend python scripts/seed_demo_accounts.py
```

Don't run this and a local `uvicorn` at the same time, because both use port 8000.

---

## 5. Running the frontend (app)

From the **repo root**:

```powershell
npm install
```

### 5.1 Point the app at the backend

The app picks the API address like this (`src/services/apiClient.js`):

| Where the app runs | Default API URL |
|---|---|
| Web browser / iOS simulator | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` (the emulator's alias for your PC) |
| **Real phone (Expo Go)** | ❌ No working default. You must set `EXPO_PUBLIC_API_URL` |

For a real phone, use your computer's **LAN IP**. Find it with `ipconfig` on Windows, `ipconfig getifaddr en0` on macOS, or `hostname -I` on Linux. Then create **`.env.local`** in the repo root:

```ini
EXPO_PUBLIC_API_URL=http://192.168.1.22:8000
```

Replace `192.168.1.22` with your own IP. Restart Expo after changing this file. It is git-ignored.

### 5.2 Start the app

```powershell
npx expo start          # dev server + QR code, then press a key:
                        #   w = open in web browser
                        #   a = open on Android emulator
                        #   i = open on iOS simulator (macOS only)
```

Shortcuts: `npm run web`, `npm run android`, `npm run ios`.

**On a real phone:** install **Expo Go**, put the phone on the **same Wi‑Fi** as your computer, and scan the QR code printed by `npx expo start`. On iOS, use the Camera app to scan.

If the QR code doesn't connect, try `npx expo start --tunnel`.

### 5.3 Web vs. phone differences

- **Staying signed in:** on a phone, login tokens are stored in the OS keychain/keystore (`expo-secure-store`) and survive restarts. In a web browser secure storage isn't available, so you need to **sign in again after reloading the page**.
- **Layout:** the app is designed for phone screens. In a desktop browser, narrow the window or use the browser's device toolbar for the intended layout.

---

## 6. Test accounts

All accounts are in the **`default-tenant`** workspace, which the app signs into:

| Role | Email | Password | What you see |
|---|---|---|---|
| **Admin** | `admin@demo.com` | `Password123!` | Opens on Admin Settings (workspace, users & roles); full agent permissions in the API |
| **Agent** | `agent@demo.com` | `Password123!` | Agent dashboard, inbox, ticket replies, internal notes, CRM |
| **Customer** | `customer@demo.com` | `Password123!` | Customer home, create/track tickets, AI chat, help center |

These accounts are **not** in the migrations. Create them on any fresh database, with the backend running:

```powershell
cd backend
python scripts/seed_demo_accounts.py                         # local API
python scripts/seed_demo_accounts.py https://your-api.example.com   # any other API
```

The script is safe to run repeatedly; existing accounts are left alone.

### How accounts work

- **Customers** can sign up themselves in the app (**Get Started**).
- **Agents and admins cannot self-register into an existing workspace.** An admin invites them with `POST /api/v1/tenants/invite`, which returns an invitation token, and the invitee accepts with `POST /api/v1/tenants/invitations/{token}/accept`.
- Only **admins** can invite admins. Agents can invite agents and customers.
- The **first person to register a brand-new workspace slug** may choose any role (the founder).

> Never use these demo passwords on a deployed server. Create real admin accounts instead.

---

## 7. Running the tests

### Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
```

This runs 172 tests against a temporary SQLite database. They don't need PostgreSQL or a running server, and cover auth, RBAC, tenant isolation, tickets, SLA, routing, macros, automations, CRM, channels and webhook security.

To check that migrations match the models on real PostgreSQL:

```powershell
alembic upgrade head
alembic check      # remaining output is only index-naming/enum-as-varchar noise; there should be no "add_column"
```

### Frontend

There is no automated frontend test suite yet. To check that the app compiles for each platform:

```powershell
npx expo export --platform android --output-dir dist-check
npx expo export --platform ios --output-dir dist-check
npx expo install --check     # SDK-compatible dependency versions
```

---

## 8. Configuration reference

Backend settings are read from environment variables or `backend/.env` (`backend/app/core/config.py`).

| Variable | Default | Purpose |
|---|---|---|
| `ENVIRONMENT` | `development` | `development` / `testing` / `production`. Production enforces a strong `SECRET_KEY` and webhook secrets |
| `DEBUG` | `False` | `True` = real error text in 500 responses + SQL logging. **Never in production** |
| `SECRET_KEY` | dev placeholder | JWT signing key. Production requires ≥ 32 chars (`openssl rand -hex 32`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access-token lifetime; the app refreshes it automatically |
| `DATABASE_URL` | — | Full DB URL (overrides `POSTGRES_*`). `postgresql://` is converted to the async driver automatically |
| `POSTGRES_SERVER` / `_PORT` / `_USER` / `_PASSWORD` / `_DB` | match docker-compose | Used when `DATABASE_URL` is empty |
| `BACKEND_CORS_ORIGINS` | `["*"]` | Allowed web origins. Credentials are only allowed with an explicit list |
| `TRUST_PROXY_HEADERS` | `False` | Set `True` behind a reverse proxy (Render/Railway/Nginx) so rate limits use the real client IP |
| `TRUSTED_PROXY_HOPS` | `1` | Number of proxies in front of the app |
| `ALLOW_STAFF_SELF_REGISTRATION` | `False` | **Tests/demos only.** Lets `/auth/register` create agents/admins in existing workspaces |
| `AI_PROVIDER` / `AI_API_KEY` / `AI_MODEL` | `mock` | AI chat/copilot provider. `mock` needs no key |
| `WHATSAPP_WEBHOOK_SECRET` | — | Meta App Secret, used to verify `X-Hub-Signature-256` |
| `WHATSAPP_VERIFY_TOKEN` | — | Meta "Verify Token" for the webhook handshake (falls back to the secret) |
| `EMAIL_WEBHOOK_SECRET` | — | Mailgun webhook signing key (or a shared HMAC key) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | unset / 587 | Outbound email for password resets. Without `SMTP_HOST`, no email is sent |

Frontend:

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL, e.g. `http://192.168.1.22:8000` or `https://api.example.com`. Put it in `.env.local` (dev) or your EAS build env |

---

## 9. API overview

Base path: `/api/v1`. Full interactive docs: **http://localhost:8000/api/v1/docs**.

Authenticated requests send `Authorization: Bearer <access_token>`.

| Prefix | Area | Who |
|---|---|---|
| `/auth` | register, login, refresh, me, logout, password reset | public / any user |
| `/tenants` | workspace settings, invitations, workspace users | admin / agent |
| `/tickets` | tickets, messages, internal notes, status, assignment | customers see only their own tickets |
| `/crm` | organizations & contacts | admin / agent |
| `/teams` | teams | admin / agent |
| `/sla`, `/routing`, `/macros`, `/automations` | SLA policies, routing rules, canned replies, triggers | admin / agent |
| `/knowledge` | knowledge-base topics & articles | any user |
| `/ai` | AI chat / copilot | any user |
| `/analytics` | dashboard metrics | admin / agent |
| `/notifications` | in-app notifications | any user |
| `/channels` | channel config + inbound webhooks | admin / provider webhooks |
| `/public` | public web forms, web-chat visitor sessions | unauthenticated, rate-limited |

### Inbound webhooks

Set these URLs in each provider's dashboard, replacing `{tenant_slug}` with the workspace slug, e.g. `default-tenant`:

| Provider | URL | Verification |
|---|---|---|
| WhatsApp (Meta) | `GET/POST /api/v1/channels/webhook/whatsapp/{tenant_slug}` | `X-Hub-Signature-256` HMAC with `WHATSAPP_WEBHOOK_SECRET`; the GET handshake checks `WHATSAPP_VERIFY_TOKEN` |
| Email (Mailgun) | `POST /api/v1/channels/webhook/email/{tenant_slug}` | Mailgun `timestamp`/`token`/`signature`. Signatures older than 5 min or reused tokens are rejected. Also accepts an `X-Webhook-Signature` HMAC over the raw body |

- **WhatsApp:** each inbound message becomes a ticket. Delivery/read receipts are acknowledged and ignored.
- **Email:** Mailgun's form posts (`sender`, `From`, `subject`, `body-plain`/`stripped-text`) and plain JSON (`from`, `subject`, `text`) are both accepted.

---

## 10. Deployment

| Target | Config file | Notes |
|---|---|---|
| **Render** | `backend/render.yaml` | Blueprint creates the API + a Postgres DB, generates `SECRET_KEY`, sets `TRUST_PROXY_HEADERS=true`, runs `alembic upgrade head` as a **pre-deploy** step |
| **Railway** | `backend/railway.toml` | Runs migrations then starts uvicorn. Set `ENVIRONMENT=production`, `SECRET_KEY`, `DATABASE_URL`, `TRUST_PROXY_HEADERS=true` in the Railway dashboard |
| **Any Docker host** | `backend/Dockerfile` | Run `alembic upgrade head` before starting new versions |

Production checklist:

- [ ] `ENVIRONMENT=production`, a random `SECRET_KEY` (≥ 32 chars), `DEBUG=False`
- [ ] `TRUST_PROXY_HEADERS=true` when behind a load balancer / PaaS proxy
- [ ] `BACKEND_CORS_ORIGINS` set to your real web origins (if you ship a web client)
- [ ] `WHATSAPP_WEBHOOK_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `EMAIL_WEBHOOK_SECRET` if those channels are used
- [ ] `SMTP_*` so password-reset emails are delivered
- [ ] `ALLOW_STAFF_SELF_REGISTRATION` **not** set
- [ ] Serve the API over **HTTPS**. Android release builds block plain `http`
- [ ] Build the app with `EXPO_PUBLIC_API_URL=https://your-api…`

---

## 11. Security model

- **Tenant isolation:** every query is scoped to the caller's workspace (`tenant_id`).
- **Roles:**
  - `customer`: own tickets only, cannot post internal notes or change staff-only ticket fields.
  - `agent`: workspace operations.
  - `admin`: everything, including roles and admin invites.
- **Sign-up:** self-registration is customer-only in existing workspaces. Staff join by invitation.
- **Message sender:** derived from the logged-in role, so customers can't post as "agent".
- **Passwords:** Argon2id, hashed in a worker thread so the API stays responsive.
- **Tokens:**
  - Access tokens last 1 hour.
  - Refresh tokens rotate on every use. Reusing an old refresh token revokes all of that user's sessions.
  - Logout and password reset revoke refresh tokens.
  - The app makes only one refresh call at a time, so a race can't trigger that revocation by accident.
- **Rate limits:** on login, register, password reset, webhooks and web-chat init.
- **Webhooks:**
  - Signatures are checked with constant-time comparison.
  - Mailgun signatures expire after 5 minutes and each token is accepted only once.
- **On the device:** tokens are kept in secure storage. Logout clears cached tickets and the offline queue, so the next user on that phone sees nothing from the previous one.

---

## 12. Troubleshooting

| Problem | Fix |
|---|---|
| App on phone: login spins then fails / "Network request failed" | Set `EXPO_PUBLIC_API_URL` to your PC's LAN IP (section 5.1), restart Expo, make sure phone and PC share Wi‑Fi |
| Phone can't reach the API or Expo at all | Windows Firewall: allow ports **8000** and **8081** on private networks (or allow Python/Node when Windows asks) |
| `failed to connect to the docker API` | Start **Docker Desktop** and wait until it says "running" |
| API error `relation "…" does not exist` / `column … does not exist` | Run `alembic upgrade head` in `backend/` |
| API won't start: "SECRET_KEY must be a cryptographically secure key" | You're in production mode. Set a ≥ 32-char `SECRET_KEY`, or use `ENVIRONMENT=development` locally |
| `Agent and admin accounts require an invitation` | Expected. Invite staff from an admin account, or run `scripts/seed_demo_accounts.py` |
| Webhook returns 503 | The provider secret isn't set while `ENVIRONMENT=production` |
| Port 8000 / 8081 already in use | Stop the other process, or run on another port (`--port 8001`, `npx expo start --port 8082`) and update `EXPO_PUBLIC_API_URL` |
| Expo: "Cannot determine the project's Expo SDK version" | `node_modules` is incomplete. Run `npm install` |
| Web: signed out after refresh | Expected on web (no secure storage). Phones keep you signed in |

---

## 13. Known limitations

- **Webhook secrets are global**, not per workspace. Per-tenant secrets need a DB table and admin UI.
- **Mailgun replay protection is in-process memory.** Running several API instances needs a shared store such as Redis.
- **The AI provider defaults to `mock`.** Responses are simulated until a real provider/key is configured. The in-app AI chat screen is also a local demo.
- **Some screens show demo data** from `src/data/mockData.js` until the backend returns real data.
- **`npm audit`** reports moderate issues in `glob`/`minimatch`. They are used only by Expo's build tooling on the developer machine and are not shipped in the app. `npm audit fix --force` would break Expo, so they are left until Expo updates them.
- **There are no automated frontend tests yet.**

For module-by-module implementation notes, see [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md).
