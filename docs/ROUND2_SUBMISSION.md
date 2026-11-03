# Round 2 submission: Trailmark

WCC Forge 48, Round 2 (The Build). Team Trailmark: Kishan S and Tharun Sridhar.

| What | Where |
| --- | --- |
| Deployed link | TO ADD AFTER DEPLOYMENT |
| Source code | https://github.com/try2mastercode/Trailmark |
| Architecture and decisions | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| APIs, models, libraries, services | [`TOOLS.md`](TOOLS.md) |
| Every endpoint | [`API.md`](API.md) |
| Test evidence | [`TESTING.md`](TESTING.md) |
| Run it locally | [`README.md`](../README.md) |

## Features done

Against the seven core features in the Round 1 plan. "Backend" means built and covered by the 187 automated tests. The frontend screens call the backend. One journey through all three roles was clicked through by hand in a browser against a local backend (not a deployed one, no automated frontend tests).

| Core feature | Status |
| --- | --- |
| 1. Source import: repository export, documents, chat export, task list, each with an access level set by the lead | Done (backend) |
| 2. Project-state reconstruction: decisions and reasons, owners, unfinished work, dependencies, risks, contacts, each linked to its source | Done (backend). The saved run on the synthetic project cites 32 of 32 planted cases |
| 3. Evidence labels. A statement with no valid source link cannot be verified | Done (backend). Word-for-word quote check, a separate verifier call, and rules in code |
| 4. Gap detection and questions for the departing member, with the evidence shown | Done (backend). At most nine questions, riskiest first |
| 5. Review and approval: edit, reject, resolve a conflict with a written reason, accept a gap, version history | Done (backend) |
| 6. Permission-aware handover: derived statements inherit their sources' restrictions | Done (backend) |
| 7. Handover view with receipt: what they own, unfinished work, risks, dependencies, open questions, ordered next actions, confirm receipt | Done (backend) |

Also built: Gemini, Groq and Anthropic clients, retries and an optional second model, saved results from a real run, a basic listing when there are no saved results, and redaction of secrets, emails and phone numbers in the incoming view.

## Saved run on the synthetic project

`backend/saved_results/campus-events-app.json`, one real run: 106 statements (54 verified, 31 unverified, 18 missing, 3 conflicting) and 9 questions. Scored against the answer key: 32 of 32 planted cases cited, 31 with the expected label, 3 of 3 conflicts, 4 of 4 leaver-only claims unverified. The one wrong label is C28 (deployment guide, the persistent volume), which the model called a gap. No statement or question names a restricted source's file name, path, paragraph number or title. The earlier wrong label, C02 (chat message 5, "Render over Heroku"), is `verified` in this run only because Deepak's message 6 agrees; when only the leaver's own message is cited it stays `unverified`, which is the leaver-only rule working as designed. Details are in [`TESTING.md`](TESTING.md).

## Changes from the Round 1 plan

| Plan said | What we did | Why |
| --- | --- | --- |
| PostgreSQL with pgvector and similarity search | PostgreSQL in deployment, SQLite locally, no pgvector | The demo project is small enough to give the model every piece in one request. Similarity search would add work without a benefit at this size |
| Postgres row-level security as a second layer | Not built | Access is enforced in the backend and covered by tests. We say so instead of claiming a layer we do not have |
| GitHub REST API for repository data | Upload of a repository export (JSON) | No tokens or live access to manage, and it works offline |
| Backend, frontend and database in Docker Compose | Compose runs the backend and Postgres. The frontend has a Dockerfile and a `frontend` profile, but the image has not been built yet (Docker was not running) | The frontend runs with `npm run dev`, or build the image with `docker compose --profile frontend up --build` |

## Three improvements committed for Round 3

Not built yet.

1. **Follow-up questions.** The incoming member can ask a question on any statement. The lead or departing member answers it, and the answer is saved as a new version.
2. **Decision timeline.** Key decisions, changes and unresolved discussions over time, with conflicts shown side by side and each item linked to its evidence.
3. **Audit log and stronger access control.** A record of who viewed, edited and approved what, plus tests that restricted information never appears in a summary, question, answer or redacted text, for every role.

## Known limitations

- The score varies from run to run, because the model is not deterministic. In the last round the three runs got the expected label on 29, 30 and 31 of 32 cases (30, 32 and 32 cited). Earlier rounds were weaker, down to 15. The saved run is the best of its round, so it is not typical, which is why the saved fallback exists.
- Not tested yet: a deployed instance, the frontend in AI mode, and the current suite on PostgreSQL (149 tests passed there earlier, 38 have been added since).
- The AI runs on the free tier of Gemini, which limits requests. If the service is unavailable the app shows the saved results.
- Redaction is pattern based and will miss some sensitive text.
- All pieces go to the model in one request, so a large repository would need chunking.
- Only three kinds of conflict are checked by rules in code. Other conflicts depend on the model.
- No live Slack, Jira or GitHub API import.
- The demo screens sign in with fixed demo accounts and one demo password, which is fine for synthetic data and not for real use.
- Full lists: [`TESTING.md`](TESTING.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Tools and AI disclosure

See [`TOOLS.md`](TOOLS.md). Demonstration data is synthetic. The backend, tests and documents were written with help from Claude Code and reviewed by the team.
