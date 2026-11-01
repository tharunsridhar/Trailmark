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

## Planned technology

- Frontend: React (Next.js)
- Backend: Python, FastAPI
- Database: PostgreSQL with pgvector
- AI: a large language model API, with structured output and claim-support checks
- Containers: a minimal Docker setup
- Hosting: Vercel (frontend) and Render (backend and database)

## Status

Round 2 build. Done on the backend: sign-in with roles, handovers and members, source import (repository export, documents, chat, tasks), the AI analysis (reconstruct, quote check, separate verification call, labels, gaps and questions to the departing member), the saved-results and basic fallbacks, and the access check that hides any statement whose sources the viewer may not see. Still to come: answering questions, review and approval with versions, the incoming member's view with receipt, Docker and deployment. The frontend and the synthetic project are in progress (see `frontend/` and `data/`). Setup notes, testing notes, known limitations and a roadmap will keep growing here.

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

Locally the backend uses SQLite, so nothing else needs installing. Postgres comes with the Docker setup.

## Changes from the Round 1 plan

- pgvector and similarity search are not used for now. The model is given all source pieces in one request instead, which is fine for a project of the demo size but would need chunking for a large repository. We may add it back if time allows.
- Repository data comes from an uploaded export (JSON), not live from the GitHub REST API.

## How the AI analysis stays honest

1. The model must cite source pieces by id with a word-for-word quote. If the quote is not in the cited piece, the claim is thrown away.
2. A second, separate model call sees only the claim and its quotes. Only a clear "supported" makes a statement `verified`, anything else stays `unverified`.
3. Two sources that disagree become one `conflicting` statement that cites both.
4. Missing information is reported as a `missing` gap with a question for the leaver, never filled in.
5. If the AI service fails, the last good results are shown (marked as saved), and if there are none, a basic listing built only from structured fields such as task owners. The response always says which mode was used.

Set `LLM_API_KEY` in `.env` to turn the AI on. Without it the analysis runs in the saved or basic mode.

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
