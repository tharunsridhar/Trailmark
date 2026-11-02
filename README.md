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
4. **Ask.** For each gap, the departing member gets a specific question together with the evidence that raised it. Unanswered questions stay visible as open gaps.
5. **Review.** The project lead edits, rejects, resolves conflicts (with a written reason) and approves. Every change is versioned, and nothing is shared until a person approves it.
6. **Hand over.** The incoming member sees only the approved handover, filtered to their permissions, with what they own, unfinished work, risks, dependencies, open questions and a recommended order of next actions. Each statement links to its source, and they confirm receipt.

## Key principles

- **Traceable:** important statements link back to their supporting sources.
- **Honest about uncertainty:** missing, unverified and conflicting information is shown, not hidden or guessed.
- **Permission-aware:** summaries and derived statements inherit the restrictions of their sources, and restricted content is hidden or redacted.
- **Human-controlled:** a person reviews, corrects and approves every handover.

## Technology

- Frontend: React (Next.js), on Vercel
- Backend: Python, FastAPI, on Render
- Database: PostgreSQL in deployment, SQLite for local work (no pgvector, see the changes below)
- AI: a large language model API, Gemini by default (Groq and Anthropic also supported), with structured output, quote checks and a separate claim-support check
- Containers: Docker and Docker Compose

## Status

Round 2 build. The backend covers the whole workflow and is tested (149 tests on SQLite and PostgreSQL): sign-in with roles, handovers and members, source import, the AI analysis with quote and verification checks, the saved-results and basic fallbacks, the departing member's answers, the lead's review and approval, the incoming member's redacted and permission-filtered handover, and the receipt. The AI has been run on the synthetic project and the results are saved in `backend/saved_results/`. It finds about 24 of 32 planted cases and misses claims only the leaver makes, details in `docs/TESTING.md`. Docker and Render configuration are written, the deployment steps are in `docs/DEPLOY.md`. The frontend screens (Kishan) are being connected to the backend.

## Running the backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # on macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env    # then set JWT_SECRET to a long random string
uvicorn app.main:app --reload
```

The API is at `http://localhost:8000` and its interactive docs at `/docs`. Every endpoint, live and planned, is listed in [`docs/API.md`](docs/API.md).

Run the tests:

```bash
cd backend
pytest
```

Locally the backend uses SQLite, so nothing else needs installing.

## Running everything with Docker

```bash
docker compose up --build
```

This starts PostgreSQL and the backend at `http://localhost:8000` (if that port is taken, set `BACKEND_PORT=8010` first). Put your values in a `.env` file first (see `.env.example`), at least `JWT_SECRET` and `LLM_API_KEY`. The frontend joins with `docker compose --profile frontend up --build` once `frontend/` has its Dockerfile. Saved analysis results are written to `backend/saved_results/`.

## Deploying

`render.yaml` describes the backend and its database for Render, and the frontend goes on Vercel. Because they are on different domains, set `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none` and `FRONTEND_ORIGIN` to the exact Vercel address. In a deployed setup the app refuses to start with a weak `JWT_SECRET`.

## Documents

- [`docs/API.md`](docs/API.md): every endpoint with sample requests and responses
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): components, data flow, access control, decisions
- [`docs/TOOLS.md`](docs/TOOLS.md): APIs, models, libraries and services used
- [`docs/TESTING.md`](docs/TESTING.md): what is tested, what is not
- [`docs/ROUND2_SUBMISSION.md`](docs/ROUND2_SUBMISSION.md): features completed, changes from the plan, Round 3 commitments

## Changes from the Round 1 plan

- pgvector and similarity search are not used for now. The model is given all source pieces in one request instead, which is fine for a project of the demo size but would need chunking for a large repository. We may add it back if time allows.
- Repository data comes from an uploaded export (JSON), not live from the GitHub REST API.

## How the AI analysis stays honest

1. The model must cite source pieces by id with a word-for-word quote. If the quote is not in the cited piece, the claim is thrown away.
2. Something only the departing member says in chat, with no code, document, task or other person behind it, is never `verified`: it stays `unverified`.
3. A second, separate model call sees only the claim and its quotes. Only a clear "supported" makes a statement `verified`, anything else stays `unverified`.
4. Two sources that disagree become one `conflicting` statement that cites both.
5. Missing information is reported as a `missing` gap with a question for the leaver, never filled in.
6. Text shown to the incoming member has emails, phone numbers and secrets masked, and a statement is hidden unless they may see every source behind it.
7. If the AI service fails, the last good results are shown (marked as saved), and if there are none, a basic listing built only from structured fields such as task owners. The response always says which mode was used.

Set `LLM_API_KEY` in `.env` to turn the AI on (a free Gemini key from Google AI Studio works, see `.env.example` for Groq and Anthropic). Without it the analysis runs in the saved or basic mode.

## Privacy, security and responsible design

- **Access is checked in the backend.** Every endpoint checks who you are and your role in that handover. A statement or question is shown only if the viewer may see every source behind it, so a summary of a restricted document inherits the restriction. The incoming member only sees what the lead approved.
- **Logins** use argon2 password hashes and a signed token in an HTTP-only cookie. The AI key stays on the server and is never sent to the browser. A deployed server refuses to start with a weak `JWT_SECRET`.
- **Redaction is pattern based.** Emails, phone numbers and secrets are masked for the incoming member, but pattern matching will miss some sensitive text. Do not rely on it for real data.
- **The AI service sees everything the lead connects**, including sources only the lead may read. Connect only data you are allowed to send to the AI provider, and check the provider's terms, since free tiers may use submitted content. All demonstration data here is synthetic.
- **The AI can be wrong, so the product shows its evidence.** Each statement links to a quote copied from its source, quotes that are not in the source are thrown away, and a separate check decides what counts as verified. Missing information is reported as a gap with a question, never filled in. A person reviews and approves every handover.
- **Not built yet:** database row-level security, and the audit log (planned for Round 3).

## Team

| Member | GitHub | Main areas |
| --- | --- | --- |
| Kishan S (team leader) | [KishanSadeesh](https://github.com/KishanSadeesh) | Frontend, synthetic demo project, testing, deployment, demonstration |
| Tharun Sridhar | [tharunsridhar](https://github.com/tharunsridhar) | AI pipeline, backend, access control, Docker, documentation |

Both members work together across the project.

The repository is owned by the GitHub account `try2mastercode`, which belongs to Tharun Sridhar. All commits come from the two members' own accounts listed above.

## Disclosure

- Demonstration data will be synthetic and will be disclosed as such.
- AI assistance used in development, including AI-generated code, is disclosed in this repository. The backend code was written with help from Claude Code and reviewed by the team.
- External services planned: a large language model API, GitHub, Vercel and Render.
