# Round 2 submission: Trailmark

WCC Forge 48, Round 2 (The Build). Team Trailmark: Kishan S and Tharun Sridhar.

| What | Where |
| --- | --- |
| Deployed link | _add after deployment_ |
| Source code | https://github.com/try2mastercode/Trailmark |
| Architecture and data flow | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| APIs, models, libraries, services | [`TOOLS.md`](TOOLS.md) |
| Testing evidence | [`TESTING.md`](TESTING.md) |
| Every endpoint | [`API.md`](API.md) |
| Run it locally | the README |

## Features completed

Against the seven core features in the Round 1 plan:

| Core feature | Status |
| --- | --- |
| Source import: repository export, documents, chat export, task list, each with an access level set by the lead | Done |
| Project-state reconstruction: decisions and reasons, owners, unfinished work, dependencies, risks, contacts, each linked to its source | Done (backend). Run on the synthetic project, 32 of 32 planted cases cited in the saved run |
| Evidence labels: verified, unverified, missing, conflicting. A statement with no valid source link cannot be verified | Done, with a word-for-word quote check and a separate verifier call |
| Gap detection and questions for the departing member, with the evidence shown | Done |
| Review and approval: edit, reject, resolve a conflict with a written reason, accept a gap, version history | Done |
| Permission-aware handover: derived statements inherit their sources' restrictions, restricted parts hidden | Done |
| Handover view with receipt: what they own, unfinished work, risks, dependencies, open questions, ordered next actions, confirm receipt | Done (backend). Frontend screens by Kishan |

Also built: support for Gemini, Groq and Anthropic models, saved results from a real run, redaction of secrets, emails and phone numbers in the incoming view, fallbacks when the AI service is down (saved results, then a basic listing), retries and an optional second model.

## Changes from the Round 1 plan

| Plan said | What we did | Why |
| --- | --- | --- |
| PostgreSQL with pgvector and similarity search | PostgreSQL in deployment, SQLite locally, no pgvector | The demo project is small enough to give the model every piece in one request. Similarity search would add complexity without a benefit at this size |
| Postgres row-level security as a second layer | Not built | Access is enforced in the backend and covered by tests. We prefer to say this than claim a layer we do not have |
| GitHub REST API for repository data | Upload a repository export (JSON) | No tokens or live access to manage, and it works offline for judges |
| Frontend and backend in Docker Compose | Compose runs the backend and Postgres, the frontend is added with `--profile frontend` | The frontend Dockerfile is Kishan's |

## Three improvements committed for Round 3

1. **Follow-up questions.** The incoming member can raise a question on any statement. It stays attached to that statement, the lead or departing member answers it, and the answer is saved as a new version with the editor's name. Open questions are visible to the lead, and unanswered ones are shown to the incoming member.
2. **Decision timeline.** A chronological view of key decisions, changes and unresolved discussions built from the dates in the sources. Conflicts are shown side by side with both sources, and each item links to its evidence.
3. **Audit log and stronger access control.** A record of who viewed, edited, approved and downloaded what and when, visible to the lead. Plus a dedicated test suite that checks restricted information never appears in any summary, question, answer or redacted text, for every role.

## Known limitations

- On the synthetic project the saved run cites 32 of the 32 planted cases and gets the expected label on 31, finds all three planted conflicts, marks all four leaver-only claims unverified and gives the departing member 9 questions. The wrong one is a task owned by the leaver (T09) that is marked unverified instead of verified. The other two runs of the same round also cited 32 but got the expected label on 27 and 30, and earlier runs got 15 to 29, so a run can be clearly weaker than the saved one. Details are in `TESTING.md`.
- The AI runs on the free tier of Gemini, which limits requests per day and per minute. The demo falls back to saved results from a real run if the service is unavailable.
- Redaction is pattern based and will miss some sensitive text.
- The analysis sends all pieces in one request, so very large sources would need chunking.
- No live integrations with Slack, Jira or the GitHub API.
- See `ARCHITECTURE.md` and `TESTING.md` for more.

## Tools and AI disclosure

See [`TOOLS.md`](TOOLS.md). Demonstration data is synthetic. The backend, tests and documents were written with help from Claude Code and reviewed by the team.
