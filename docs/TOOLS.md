# Tools, services and data used

Everything the project depends on, as Round 2 asks.

## AI

| What | Use |
| --- | --- |
| Anthropic Messages API | Extracting project state, writing gap questions, and a separate call that checks whether a claim is supported by its quotes |
| Model | `claude-sonnet-5-5` by default, set with `LLM_MODEL`. An optional second model (`LLM_FALLBACK_MODEL`) is tried if the first keeps failing |

The model only ever receives source pieces the lead connected. Its output is checked in code before it is used (see `ARCHITECTURE.md`).

## Backend libraries

| Library | Use |
| --- | --- |
| FastAPI, Uvicorn | The API and the server |
| SQLAlchemy | Database access |
| psycopg | PostgreSQL driver |
| Pydantic, pydantic-settings, email-validator | Request validation and settings |
| argon2-cffi | Password hashing |
| PyJWT | Signed login tokens |
| python-multipart | File uploads |
| httpx | Calling the LLM API |
| pypdf | Reading PDF documents |
| pytest | Tests |

Versions are in `backend/requirements.txt`.

## Database and infrastructure

| What | Use |
| --- | --- |
| PostgreSQL 16 | Deployment database (Docker locally, Render in deployment) |
| SQLite | Local development and the default test run |
| Docker, Docker Compose | One-command local setup (`docker-compose.yml`) |
| Render | Backend and database hosting (`render.yaml`) |
| Vercel | Frontend hosting |
| GitHub | Source repository |

## Frontend

Next.js (React, TypeScript), built by Kishan S. Libraries are listed in `frontend/package.json` once it is added.

## Data

- **Demonstration data is synthetic.** The project the product is demonstrated on is invented, with planted gaps and contradictions, and lives in `data/`.
- Small hand-written files for tests live in `backend/tests/fixtures/`.
- No real people's data, no confidential material, no external datasets.

## Templates and boilerplate

None. The backend was written for this event.

## AI assistance in development

The backend code, tests and documents were written with help from Claude Code (Anthropic) and reviewed by the team. This is disclosed in the README as well.
