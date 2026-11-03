# Trailmark

Trailmark is a knowledge-handover platform built for **WCC Forge 48** (We Code Coders). When a team member leaves a project, it reads the project's authorised sources, finds what is missing or unclear, asks the departing member about those gaps, and gives the incoming member a reviewed, evidence-linked handover.

## The problem

When someone leaves a project, the files stay but much of what they knew leaves with them: why decisions were made, what was left half done, which parts depend on others, what usually breaks, and who to ask. This knowledge is scattered across chats, commits, pull requests, task boards and meeting notes, and often exists only in the leaver's memory. The incoming member has to rebuild the picture from fragments, and the remaining team loses time to questions and rework.

## How Trailmark works

1. **Connect.** The project lead connects authorised sources: a code repository, documents, a chat export and a task list, and sets who may see each one.
2. **Reconstruct.** Trailmark rebuilds the project's current state: decisions and their reasons, owners, unfinished work, dependencies, risks and key contacts. Each item keeps a link to its source.
3. **Verify.** Every statement is labelled:
   - **Verified**: supported by a source, shown with the link.
   - **Unverified**: stated by the departing member only.
   - **Missing or conflicting**: nothing was found, or sources disagree. Trailmark says so and does not fill the gap.
4. **Ask.** For each gap, the departing member gets a specific question together with the evidence that raised it, at most nine questions, riskiest first. Unanswered questions stay visible as open gaps.
5. **Review.** The project lead edits, rejects, resolves conflicts (with a written reason) and approves. Every change is versioned, and nothing is shared until a person approves it.
6. **Hand over.** The incoming member sees only the approved handover, filtered to their permissions, with what they own, unfinished work, risks, dependencies, open questions and a recommended order of next actions. Each statement links to its source, and they confirm receipt.

## Key principles

- **Traceable:** important statements link back to their supporting sources.
- **Honest about uncertainty:** missing, unverified and conflicting information is shown, not hidden or guessed.
- **Permission-aware:** summaries and derived statements inherit the restrictions of their sources, and restricted content is hidden or redacted.
- **Human-controlled:** a person reviews, corrects and approves every handover.

## Technology

- Frontend: React (Next.js 14, TypeScript, Tailwind CSS), planned for Vercel
- Backend: Python 3.12, FastAPI, planned for Render
- Database: PostgreSQL in deployment, SQLite for local work (no pgvector, see the changes below)
- AI: a large language model API, Gemini by default (Groq and Anthropic also supported), with structured output, quote checks and a separate claim-support check
- Containers: Docker and Docker Compose (backend and database)

The full list of libraries, models and services is in [`docs/TOOLS.md`](docs/TOOLS.md).

## Status

Round 2 build. Nothing is deployed yet.

- **Backend:** covers the whole workflow and has 180 automated tests, all passing on SQLite. An earlier 149 also passed on PostgreSQL, the suite has not been run on PostgreSQL since. Sign-in with roles, handovers and members, source import, the AI analysis with quote and verification checks, the saved-results and basic fallbacks, the departing member's answers, the lead's review and approval, the incoming member's redacted and permission-filtered handover, and the receipt.
- **AI run:** the AI has been run on the synthetic project and the result is saved in `backend/saved_results/` (114 statements, 9 questions). It cites 32 of 32 planted cases, 31 with the expected label, finds all three planted conflicts and marks all four claims only the leaver makes as unverified. Other runs vary and some are weaker (31, 30 and 27 in the last round, 15 in an earlier one). Details in [`docs/TESTING.md`](docs/TESTING.md).
- **Frontend:** the screens call the backend. The integration has not been tested end to end yet.
- **Deployment:** the Docker and Render configuration is written but untested on Render. Steps are in [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Setup

You need Python 3.12 and Node.js. Docker is optional.

### Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # on macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env    # then set JWT_SECRET to a long random string
uvicorn app.main:app --reload
```

The API is at `http://localhost:8000` and its interactive docs at `/docs`. `GET /health` answers `{"status": "ok"}`. Every endpoint is listed in [`docs/API.md`](docs/API.md). Locally the backend uses SQLite, so nothing else needs installing.

Without `LLM_API_KEY` the analysis runs in the saved or basic mode. For the AI, set `LLM_API_KEY` in `.env` (a free Gemini key from Google AI Studio works).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app is at `http://localhost:3000` and talks to `http://localhost:8000` unless `NEXT_PUBLIC_API_URL` says otherwise. The backend must be running, and `FRONTEND_ORIGIN` in `.env` must match the frontend address.

### Settings (`.env`)

| Variable | Meaning | Default |
| --- | --- | --- |
| `DATABASE_URL` | SQLite file or PostgreSQL address | `sqlite:///./trailmark.db` |
| `JWT_SECRET` | Signs login tokens. A deployed server (`COOKIE_SECURE=true`) refuses to start unless it is at least 32 characters | `change-me` |
| `JWT_EXPIRE_MINUTES` | Login lifetime | `60` |
| `COOKIE_SECURE`, `COOKIE_SAMESITE` | `true` and `none` when frontend and backend are on different domains | `false`, `lax` |
| `FRONTEND_ORIGIN` | Frontend address allowed by CORS | `http://localhost:3000` |
| `LLM_API_KEY` | AI service key. Empty means no AI | empty |
| `LLM_PROVIDER` | `gemini`, `groq` or `anthropic` | `gemini` |
| `LLM_MODEL` | Main model | `gemini-3.6-flash` |
| `LLM_FALLBACK_MODEL` | Second model, tried if the first keeps failing | `gemini-3.5-flash-lite` |
| `LLM_REASONING_EFFORT` | `low`, `medium` or `high` for models that think first | `low` |
| `LLM_BASE_URL` | Override the provider address | empty |
| `SAVED_RESULTS_DIR` | Where analysis results are saved | `saved_results` |
| `TEST_DATABASE_URL` | Run the tests on PostgreSQL | not set |

The last four are read by the code but are not in `.env.example`.

## Running the tests

```bash
cd backend
python -m pytest -q
```

The AI is never called in tests. How to run them on PostgreSQL, what each file covers and what is not tested yet is in [`docs/TESTING.md`](docs/TESTING.md).

## Running with Docker

```bash
docker compose up --build
```

This starts PostgreSQL and the backend at `http://localhost:8000` (if that port is taken, set `BACKEND_PORT=8010` first). Put your values in a `.env` file first (see `.env.example`), at least `JWT_SECRET` and `LLM_API_KEY`. The `frontend` service in `docker-compose.yml` needs a `frontend/Dockerfile`, which does not exist yet, so run the frontend with `npm run dev` as above. Saved analysis results are written to `backend/saved_results/`.

## Deploying

`render.yaml` describes the backend and its database for Render, and the frontend goes on Vercel. Because they are on different domains, set `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none` and `FRONTEND_ORIGIN` to the exact Vercel address. In a deployed setup the app refuses to start with a weak `JWT_SECRET`. The steps are in [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Documents

- [`docs/API.md`](docs/API.md): every endpoint with sample requests and responses
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): components, data flow, access control, decisions
- [`docs/TOOLS.md`](docs/TOOLS.md): APIs, models, libraries and services used
- [`docs/TESTING.md`](docs/TESTING.md): what is tested, what is not
- [`docs/DEPLOY.md`](docs/DEPLOY.md): deployment checklist
- [`docs/FEEDBACK.md`](docs/FEEDBACK.md): user feedback sessions (none yet)
- [`docs/ROUND2_SUBMISSION.md`](docs/ROUND2_SUBMISSION.md): features completed, changes from the plan, Round 3 commitments
- [`docs/Trailmark_Round1_Plan.pdf`](docs/Trailmark_Round1_Plan.pdf): the Round 1 plan

## Changes from the Round 1 plan

- pgvector and similarity search are not used. The model is given all source pieces in one request instead, which is fine for a project of the demo size but would need chunking for a large repository.
- Postgres row-level security is not built. Access is enforced in the backend and covered by tests.
- Repository data comes from an uploaded export (JSON), not live from the GitHub REST API.
- The frontend is not in Docker Compose yet (no `frontend/Dockerfile`).

## How the AI analysis stays honest

1. The model must cite source pieces by id with a word-for-word quote. If the quote is not in the cited piece, the claim is thrown away.
2. Something only the departing member says in chat, with no code, document, task or other person behind it, is never `verified`: it stays `unverified`.
3. A second, separate model call sees only the claim and its quotes. Only a clear "supported" makes a statement `verified`, anything else stays `unverified`.
4. Two sources that disagree become one `conflicting` statement that cites both.
5. Missing information is reported as a `missing` gap with a question for the leaver, never filled in. Rules in code (not the model) add gaps for unowned tasks and for commits nothing explains. They are listed in [`docs/TESTING.md`](docs/TESTING.md).
6. Text shown to the incoming member has emails, phone numbers and secrets masked, and a statement is hidden unless they may see every source behind it.
7. If the AI service fails, the last good results are shown (marked as saved), and if there are none, a basic listing built only from structured fields such as task owners. The response always says which mode was used.

## Privacy, security and responsible design

- **Access is checked in the backend.** Every endpoint checks who you are and your role in that handover. A statement or question is shown only if the viewer may see every source behind it, so a summary of a restricted document inherits the restriction. The incoming member only sees what the lead approved.
- **Logins** use argon2 password hashes and a signed token in an HTTP-only cookie. The AI key stays on the server and is never sent to the browser. A deployed server refuses to start with a weak `JWT_SECRET`.
- **The demo screens use fixed demo accounts** with one shared demo password. That is acceptable for synthetic data and not for real use.
- **Redaction is pattern based.** Emails, phone numbers and secrets are masked for the incoming member, but pattern matching will miss some sensitive text. Do not rely on it for real data.
- **The AI service sees everything the lead connects**, including sources only the lead may read. Connect only data you are allowed to send to the AI provider, and check the provider's terms, since free tiers may use submitted content. All demonstration data here is synthetic.
- **The AI can be wrong, so the product shows its evidence.** Each statement links to a quote copied from its source, quotes that are not in the source are thrown away, and a separate check decides what counts as verified. Missing information is reported as a gap with a question, never filled in. A person reviews and approves every handover.
- **Not built yet:** database row-level security and the audit log (the audit log is planned for Round 3).

## Known limitations

- The AI result varies from run to run. The saved result is the best of its round, not a typical one.
- Not tested yet: a deployed instance, the frontend end to end, and the current suite on PostgreSQL.
- The AI runs on a free tier with request limits. When it is unavailable, the app shows saved results from a real run, then a basic listing.
- All pieces go to the model in one request, so a large repository would need chunking.
- Only three kinds of conflict (token lifetime, capacity, QR format) are checked by rules in code, others depend on the model.
- Redaction is pattern based.
- No live Slack, Jira or GitHub API import. Repositories come in as an uploaded export.
- No database migrations (tables are created at start), and a running analysis is lost if the server restarts.

More in [`docs/TESTING.md`](docs/TESTING.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Roadmap

Committed for Round 3 (not built yet):

1. Follow-up questions on any statement, answered by the lead or departing member as new versions.
2. A decision timeline with conflicts shown side by side.
3. An audit log of who viewed, edited and approved what, and tests that restricted information never appears in a summary.

Also planned: fix reliability problems found in Round 2, improve usability and accessibility, and run structured feedback sessions ([`docs/FEEDBACK.md`](docs/FEEDBACK.md)). Ideas beyond that: live source connectors, chunking for large repositories, database migrations, and Postgres row-level security.

## Team

| Member | GitHub | Main areas |
| --- | --- | --- |
| Kishan S (team leader) | [KishanSadeesh](https://github.com/KishanSadeesh) | Frontend, synthetic demo project, testing, deployment, demonstration |
| Tharun Sridhar | [tharunsridhar](https://github.com/tharunsridhar) | AI pipeline, backend, access control, Docker, documentation |

Both members work together across the project.

The repository is owned by the GitHub account `try2mastercode`, which belongs to Tharun Sridhar. All commits come from the two members' own accounts listed above.

## Disclosure

- Demonstration data is synthetic.
- AI assistance used in development, including AI-generated code, is disclosed in this repository. The backend code was written with help from Claude Code and reviewed by the team.
- External services: a large language model API (Gemini by default), GitHub, Render and Vercel. Render and Vercel are not deployed to yet.
