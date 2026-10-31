# SupportDeskAI — Python FastAPI Backend

The official backend service for **SupportDeskAI**, built with **Python 3.12+**, **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.x**, and **Alembic**.

---

## 1. Architecture & Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **API Framework** | FastAPI 0.115+ | High-performance asynchronous REST API with automatic OpenAPI docs |
| **Server Engine** | Uvicorn (ASGI) | Lightning-fast ASGI production server |
| **Data Validation** | Pydantic v2 & Pydantic-Settings | Request/response schema validation & typed environment settings |
| **Database ORM** | SQLAlchemy 2.x (Async & Sync) | Async ORM mapped to PostgreSQL via `asyncpg`, sync via `psycopg2` |
| **Database Migrations** | Alembic | Version-controlled schema migrations |
| **Authentication** | PyJWT & Argon2id | Secure Argon2id password hashing and JWT access token handling |
| **Testing** | Pytest & pytest-asyncio & HTTPX | Automated asynchronous API integration and unit tests |
| **Containerization** | Docker & Docker Compose | Local PostgreSQL and backend service containerization |

---

## 2. Directory Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point, middleware & error handlers
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # Pydantic BaseSettings environment configuration
│   │   └── security.py          # Argon2id password hashing & JWT token management
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py              # SQLAlchemy 2.0 DeclarativeBase & TimestampMixin
│   │   └── session.py           # Async and sync engines & session dependency generators
│   ├── models/
│   │   └── __init__.py          # Database models (Base exported for Alembic discovery)
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── health.py            # Pydantic response models
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py        # Central API v1 router aggregator
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           └── health.py    # Health check endpoints probing PostgreSQL
│   └── services/
│       └── __init__.py          # Business logic and service layer
├── alembic/
│   ├── versions/                # Alembic migration script revisions
│   ├── env.py                   # Alembic runtime environment connecting to SQLAlchemy models
│   ├── README
│   └── script.py.mako           # Migration template file
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Test fixtures and ASGI async HTTP test client
│   ├── test_health.py           # Unit tests for root, health, and v1 health endpoints
│   └── test_security.py         # Unit tests for Argon2id hashing and JWT encoding/decoding
├── .env.example                 # Environment variables template
├── .gitignore                   # Python and environment ignore rules
├── alembic.ini                  # Alembic CLI configuration file
├── requirements.txt             # Locked Python package dependencies
├── Dockerfile                   # Multi-stage container definition
├── docker-compose.yml           # Local orchestration for PostgreSQL and FastAPI
└── README.md                    # Documentation
```

---

## 3. Getting Started (Windows)

### Prerequisites
* Python 3.12 or compatible version (e.g., Python 3.14)
* PostgreSQL 16 (local installation or via Docker Compose)

### 3.1 Local Environment Setup
```powershell
# Navigate into backend directory
cd backend

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env
```

### 3.2 Running the Backend Locally
```powershell
# Start Uvicorn development server with hot-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The service will be accessible at:
* **Root Index**: `http://localhost:8000/`
* **Health Check**: `http://localhost:8000/health`
* **API v1 Health Probe**: `http://localhost:8000/api/v1/health`
* **Interactive Swagger UI**: `http://localhost:8000/api/v1/docs`
* **ReDoc Documentation**: `http://localhost:8000/api/v1/redoc`

---

## 4. Running with Docker Compose

To start both PostgreSQL and the FastAPI backend in synchronized containers:

```powershell
# From project root:
docker-compose up -d --build

# Or from backend directory:
docker-compose -f backend/docker-compose.yml up -d --build
```

---

## 5. Database Migrations (Alembic)

```powershell
# Generate a new migration revision based on updated models:
alembic revision --autogenerate -m "create_initial_tables"

# Apply pending migrations to database:
alembic upgrade head

# Rollback one migration:
alembic downgrade -1
```

---

## 6. Running Tests

Execute automated test suites using `pytest`:

```powershell
# Run all tests
pytest

# Run tests with detailed output and coverage
pytest -v -s
```

