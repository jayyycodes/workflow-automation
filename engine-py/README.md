# Workflow AI Engine (Python)

Python service for AI-powered automation generation.

## Status

**Step 1.5**: Minimal scaffold only. AI/LLM logic will be added in Step 2.

## Quick Start

```bash
cd c:\Development\engine-py

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app:app --reload --port 8000
```

## Endpoints

| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/health` | ✅ Ready |
| POST | `/parse-intent` | 🔮 Step 2 |
| POST | `/generate-automation` | 🔮 Step 2 |

## Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "python service ready",
  "timestamp": "2024-12-22T23:52:00",
  "version": "0.1.0"
}
```

## Architecture

```
Node.js (port 3000) ──HTTP──▶ Python (port 8000)
     │                              │
     │ aiBridgeService.js           │ app.py
     │ calls Python endpoints       │ AI/LLM logic
     │                              │
     ▼                              ▼
 PostgreSQL                   LLM Provider
 (automations)                (Step 2)
```
