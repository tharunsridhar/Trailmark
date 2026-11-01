# Trailmark architecture

How the system fits together, how data moves through it, and why the main technical choices were made. Round 2 document, kept in step with the code.

## Overview

```
 Browser (Next.js, Vercel)
        |  HTTPS, login cookie
        v
 FastAPI backend (Render) ----> LLM API (Anthropic Messages API)
        |
        v
 PostgreSQL (SQLite for local work)
```

- **Frontend:** Next.js (React, TypeScript), owned by Kishan. It only talks to the backend through the endpoints in [`API.md`](API.md).
- **Backend:** Python, FastAPI. All permissions are enforced here, never in the frontend.
- **Database:** PostgreSQL in deployment, SQLite for local development and fast tests. One schema for both.
- **AI:** one provider behind a small client (`app/pipeline/llm.py`), with retries and an optional second model.

## Backend layout

| Path | Job |
| --- | --- |
| `app/main.py` | App, CORS, startup checks, router wiring |
| `app/config.py` | Settings from environment variables, refuses a weak secret in deployment |
| `app/db.py`, `app/models.py` | Engine, sessions, tables |
| `app/security.py`, `app/deps.py` | Password hashing, signed login cookie, "who is this and what is their role here" |
| `app/access.py` | The rule for who may see a source piece or a statement |
| `app/redact.py` | Masks secrets, emails and phone numbers for the incoming member |
| `app/importers.py` | Repository export, documents, chat and task files into pieces |
| `app/pipeline/` | LLM client, prompts, analysis, quote and verifier checks, fallbacks, background runner |
| `app/routers/` | One file per area: auth, handovers, sources, analysis, questions, review, view |
| `app/services.py` | Versioning and response building shared by routers |

## Data flow

1. **Connect** (`POST /handovers/{id}/sources`). The lead uploads a source and chooses which roles may see it. The importer splits it into small pieces. Each piece keeps a locator ("commit a3f9c21", "chat message 14", "task T2") and a copy of its source's allowed roles. A file that is empty or cannot be read is recorded as such.
2. **Reconstruct** (`POST /handovers/{id}/analyze`, runs in the background). All pieces go to the model in one request. It must return statements and gaps, each citing piece ids with a word-for-word quote.
3. **Verify.** In code, a quote that is not in the cited piece throws the claim away, and a statement with no valid evidence is dropped. A second, separate model call sees only the claim and its quotes and answers `supported`, `partly_supported` or `not_supported`. Only `supported` becomes `verified`. Two pieces that disagree become one `conflicting` statement that cites both. Missing information becomes a `missing` gap with a question, never a guess.
4. **Ask** (`GET /handovers/{id}/questions`, `POST /questions/{id}/answer`). Each gap becomes a question for the departing member, highest risk first, shown with its evidence. An answer is stored as an `unverified` statement, the gap it covers is marked answered. Skipped and unknown questions stay open.
5. **Review** (`/statements/...`). The lead can edit, reject, resolve a conflict (a reason is required, the other source is kept and marked not chosen) or accept a gap. Every change is a new version with the editor and the reason.
6. **Approve** (`POST /handovers/{id}/approve`). Blocked while a conflict is open. Statements still in draft become approved, rejected ones stay out, and the handover becomes read-only.
7. **Hand over** (`GET /handovers/{id}/handover-view`). The incoming member gets sections for decisions, owners, unfinished work, risks, dependencies, contacts, the leaver's answers, open questions and ordered next actions, each with source links.
8. **Acknowledge** (`POST /handovers/{id}/receipt`). The incoming member confirms receipt.

## Data model

`users`, `handovers` (draft or approved), `memberships` (a user's role inside one handover), `sources` and `source_pieces` (with `allowed_roles`), `statements` (kind, label, status, version) linked to pieces through `statement_sources` (with the quote and, for conflicts, which source was chosen), `statement_versions`, `questions` linked to pieces through `question_pieces`, `answers`, `receipts`, and `analysis_runs` (mode, notice, counts, how many claims were dropped).

## Access control

- **Sign-in:** email and password, stored as argon2 hashes. Login sets a signed token in an HTTP-only cookie.
- **Roles belong to a handover.** One check per request loads the user and their membership. No token is `401`. Not a member, or the wrong role, is `403`. A missing handover and someone else's handover give the same `403`.
- **Source access.** The lead sets `allowed_roles` per source. Every piece copies it. The lead can always see everything, since the lead reviews it all.
- **Derived statements inherit.** A statement, or a question, is shown only to a viewer who may see every source piece behind it. A summary being new text, not a copy, changes nothing. This is `app/access.py`, and it is applied to statements, questions and the incoming view.
- **The incoming view is always filtered as the incoming role.** The lead's preview calls the same code, so what the lead previews is exactly what the incoming member gets. The departing member cannot open it.
- **Only approved content is shared.** Drafts, rejected claims and answered gaps never reach the incoming member.
- **Redaction.** Text and quotes shown to the incoming member have secrets, emails and phone numbers masked. It is pattern based, a safety net on top of the access rules and not a replacement for them.

## When the AI fails

An analysis run records its `mode`:

1. `ai`: the model worked. The results are also saved to disk.
2. `saved`: the model failed (after retries and the optional second model), so the last good results are loaded and re-attached to the current pieces. The response carries a notice saying so.
3. `basic`: the model failed and nothing is saved. A listing is built only from structured fields: task owners, unowned tasks, open pull requests and issues, commit authors. Nothing is invented.

Garbage from the model (not JSON, wrong shape) counts as a failure and follows the same path. A run that is lost, for example the server restarts mid-run, is treated as failed after 10 minutes and no longer blocks a new analysis.

## Security and handling of secrets

- API keys and database credentials live in environment variables only. `.env` is ignored by git, the repository holds `.env.example`.
- The LLM and the database are only called from the backend.
- With `COOKIE_SECURE=true` (a real deployment) the app refuses to start unless `JWT_SECRET` is at least 32 characters.
- Uploads are capped at 5 MB and the container runs as a non-root user.
- Demo data is synthetic only.

## Key decisions and trade-offs

| Decision | Why | Cost |
| --- | --- | --- |
| Quote check in code plus a separate verifier call | A claim with a made-up quote is caught without trusting the model. Checking support separately avoids the model grading its own work. | Two model calls per analysis. It reduces unsupported claims but cannot prove correctness, which is why a person approves. |
| Hide statements unless every source is visible | Generated text can leak restricted content without copying it. | A statement mixing open and restricted sources is hidden from the incoming member completely. |
| Incoming view always filtered as incoming | One code path, no way for a preview to differ from the real thing. | The lead cannot see a "full" version through that endpoint, they use the review endpoints. |
| One model request with all pieces | Simple, and fine at the size of the demo project. | Would need chunking for a large repository. |
| SQLite locally, Postgres in deployment | Nothing to install for development, fast tests. | Postgres is a different engine, so the suite can also be run against it (see `TESTING.md`). |
| `create_all` instead of migrations | Fast for the event. | A real product would need migrations. |
| Background task in the web process | No extra service to run. | A restart loses a running analysis, handled by the stale-run rule above. |
| Repository data from an uploaded export | No tokens or live access to manage, works offline. | No live GitHub API import. |
| Redaction by patterns | Cheap and predictable. | Misses anything that does not look like a key, email or phone number. |

## Known limitations

- Quality depends on the sources provided. Tacit knowledge that is in no source only appears if the departing member answers.
- Extraction can be wrong. Review and approval exist for that reason.
- The AI has not yet been tuned on the final synthetic project (see `TESTING.md`).
- No live integrations (Slack, Jira, GitHub API), no pgvector search, no Postgres row-level security yet.
- Round 3 items are not built: follow-up questions, decision timeline, audit log.
