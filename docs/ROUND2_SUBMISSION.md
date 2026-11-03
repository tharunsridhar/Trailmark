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

Against the seven core features in the Round 1 plan. "Backend" means built and covered by the 197 automated tests. The frontend screens call the backend. One journey through all three roles was clicked through on the merged code in the built-in browser and again in Chrome against a local backend (not a deployed backend, no automated frontend tests). Voice recording was not run. The frontend has 12 automated tests that cover a small part of the screens. `tsc --noEmit` and `next build` pass.

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

`backend/saved_results/campus-events-app.json`, one real run: 106 statements (54 verified, 31 unverified, 18 missing, 3 conflicting) and 9 questions. Scored against the answer key with `backend/tests/score_run.py` on 3 Nov 2026: 32 of 32 planted cases cited, 32 with the expected label, 3 of 3 conflicts, 4 of 4 leaver-only claims unverified, 0 restricted names, 0 statements without a source. No statement or question names a restricted source's file name, path, paragraph number or title. Two lead-only statements use the generic word "restricted" ("a restricted source"); the incoming member does not see them. The earlier wrong label, C02 (chat message 5, "Render over Heroku"), is `verified` in this run only because Deepak's message 6 agrees; when only the leaver's own message is cited it stays `unverified`, which is the leaver-only rule working as designed. Details are in [`TESTING.md`](TESTING.md).

### Key correction

The answer key locations of two cases were wrong and were corrected on 3 Nov 2026. C28 and C26 are both the contact lines in `deployment_guide.md` ("For production database restore access and escalated permissions, contact Deepak" and the matching line for Ravi). The key put them at paragraph 3, but the text is in the next paragraph (key paragraph 4, importer paragraph 5). We checked this by splitting the document the way `backend/app/importers.py` does and comparing each case's description with the paragraph the key names, for all ten cases whose source is a document. Eight matched; only C26 and C28 did not. Only the `location` field of those two cases changed, not the description or the expected label, and the AI output and pipeline were not touched. With the old key the saved run scored 31 of 32 expected labels, because the correct `verified` statement for C28 was counted wrong. With the corrected key it scores 32.

Every earlier score in `TESTING.md` (the run tables, the model comparison, the 29, 30 and 31 of the last round) was computed with the old key. Only the saved run still exists as a file, so it is the only one re-scored (31 to 32). The other runs were not kept and are marked "not re-scored" in `TESTING.md`.

## Changes from the Round 1 plan

| Plan said | What we did | Why |
| --- | --- | --- |
| PostgreSQL with pgvector and similarity search | PostgreSQL in deployment, SQLite locally, no pgvector | The demo project is small enough to give the model every piece in one request. Similarity search would add work without a benefit at this size |
| Postgres row-level security as a second layer | Not built | Access is enforced in the backend and covered by tests. We say so instead of claiming a layer we do not have |
| GitHub REST API for repository data | Upload of a repository export (JSON) | No tokens or live access to manage, and it works offline |
| Backend, frontend and database in Docker Compose | Compose runs the backend and Postgres (built and checked on 3 Nov 2026 on the current code). The frontend has a Dockerfile and a `frontend` profile; that image was built and started with `docker run` on 3 Nov 2026, but `compose up` with the profile was not run | The frontend runs with `npm run dev`, or build the image with `docker compose --profile frontend up --build` |

## Three improvements committed for Round 3

Not built yet.

1. **Follow-up questions.** The incoming member can ask a question on any statement. The lead or departing member answers it, and the answer is saved as a new version.
2. **Decision timeline.** Key decisions, changes and unresolved discussions over time, with conflicts shown side by side and each item linked to its evidence.
3. **Audit log and stronger access control.** A record of who viewed, edited and approved what, plus tests that restricted information never appears in a summary, question, answer or redacted text, for every role.

## Known limitations

- The score varies from run to run, because the model is not deterministic. In the last round the three runs got the expected label on 29, 30 and 31 of 32 cases with the old key (30, 32 and 32 cited). The saved run, the one that got 31, is 32 with the corrected key; the other two were not re-scored. Earlier rounds were weaker, down to 15. The saved run is the best of its round, so it is not typical, which is why the saved fallback exists.
- Other limits: the code looks for three fixed conflict topics (any other conflict is found only if the model finds it), the routine-commit word list is a guess that was not tuned on other projects, and a score of 32 of 32 is one run scored by a generous script, not an average.
- All 197 tests pass on SQLite and on PostgreSQL 16 (3 Nov 2026, two separate runs).
- Not tested yet: voice recording and transcription (the refused-microphone message was tested with a stubbed rejection only), Firefox and Safari, a real phone, a deployed instance, `docker compose --profile frontend up`, and Docker upload and analysis on the current build. Each item is in [`TESTING.md`](TESTING.md).
- The AI runs on the free tier of Gemini, which limits requests. If the service is unavailable the app shows the saved results.
- Redaction is pattern based and will miss some sensitive text.
- All pieces go to the model in one request, so a large repository would need chunking.
- Only three kinds of conflict are checked by rules in code. Other conflicts depend on the model.
- No live Slack, Jira or GitHub API import.
- The demo screens sign in with fixed demo accounts and one demo password, which is fine for synthetic data and not for real use.
- Full lists: [`TESTING.md`](TESTING.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Tools and AI disclosure

See [`TOOLS.md`](TOOLS.md). Demonstration data is synthetic. The backend, tests and documents were written with help from Claude Code and reviewed by the team.
