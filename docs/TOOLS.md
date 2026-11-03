# Tools, services and data used

Everything the project depends on, as Round 2 asks.

## AI

| What | Use |
| --- | --- |
| Google Gemini API (free tier), through its OpenAI-compatible endpoint | Extracting project state, writing gap questions, and a separate call that checks whether a claim is supported by its quotes |
| Model | `gemini-3.6-flash` by default, set with `LLM_MODEL`, with `LLM_REASONING_EFFORT=low` so its thinking does not use up the reply. The second model `gemini-3.5-flash-lite` (`LLM_FALLBACK_MODEL`) is tried if the first keeps failing. The free tier limits requests per day and per minute (limits as noted when we set it up, not rechecked) |
| Other providers | Groq and the Anthropic Messages API are also supported, chosen with `LLM_PROVIDER` (`gemini`, `groq` or `anthropic`). `.env.example` suggests `openai/gpt-oss-120b` for Groq and `claude-sonnet-5-5` for Anthropic. Only Gemini was run on the demo project |

We tried Groq's free tier first. It limits a request to about 8,000 tokens, which is less than one analysis of the demo project needs, so Gemini is the one we run.

The model only ever receives source pieces the lead connected. Its output is checked in code before it is used (see `ARCHITECTURE.md`). If a source or a document paragraph is skipped in the first request, it is sent again on its own. If the AI service is down, the app shows saved results from an earlier real run (`backend/saved_results/`), then a basic listing.

## Backend libraries

| Library | Use |
| --- | --- |
| Python 3.12 (Docker image) | Language |
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

Built by Kishan S. Versions are in `frontend/package.json`.

| Library | Use |
| --- | --- |
| Next.js, React | The web app |
| TypeScript | Typed code and API types |
| Tailwind CSS (with PostCSS and autoprefixer) | Styling |
| lucide-react | Icons |
| clsx, tailwind-merge | Building class names |
| IBM Plex Sans, loaded from Google Fonts | The font used across the screens. The browser fetches it from `fonts.googleapis.com` |

## Data

- **Demonstration data is synthetic.** The project the product is demonstrated on is invented, with planted gaps and contradictions, and lives in `data/synthetic/`. The frontend serves a copy of it from `frontend/public/synthetic/`.
- Small hand-written files for tests live in `backend/tests/fixtures/`.
- No real people's data, no confidential material, no external datasets.

## Templates and boilerplate

None. The backend was written for this event.

## AI assistance in development

The backend code, tests and documents were written with help from Claude Code (Anthropic) and reviewed by the team. This is disclosed in the README as well.
