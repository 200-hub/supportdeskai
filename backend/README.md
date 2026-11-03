# SupportDesk AI — Backend (FastAPI)

Setup, running, configuration, test accounts and deployment for the whole project, backend included, are documented in the **[main README](../README.md)**.

Quick reference (run from this `backend/` folder):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

docker compose -f ../docker-compose.yml up -d db   # PostgreSQL on :5432
alembic upgrade head                                # create/upgrade tables
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

python scripts/seed_demo_accounts.py                # demo admin/agent/customer
pytest -q                                           # 172 tests
```

API docs while running: http://localhost:8000/api/v1/docs
