# Testing notes

## Running the tests

```bash
cd backend
pytest
```

By default the suite uses an in-memory SQLite database, so nothing else needs to be running. To run the same suite against a real PostgreSQL, set `TEST_DATABASE_URL`:

```bash
docker compose up -d db   # Postgres on 127.0.0.1:55432
TEST_DATABASE_URL=postgresql://trailmark:trailmark@127.0.0.1:55432/trailmark pytest
```

The AI is never called in tests. A scripted fake model plays back fixed replies, so tests are repeatable and free.

## Latest result

142 tests, all passing on SQLite (about 2 minutes). The 133 tests that existed before the AI provider work also passed on PostgreSQL 16 (about 4 minutes). Most of the time is password hashing.

Also checked by hand: the Docker image builds, and with `docker compose up` the backend container ran against Postgres, answered `/health`, registered a user, created a handover, and returned `401` without a login.

| File | Tests | What it covers |
| --- | --- | --- |
| `test_auth.py` | 8 | Register, login, logout, wrong password, duplicate email, short password, bad or missing token |
| `test_handovers.py` | 11 | Creator becomes lead, roles, outsiders and non-leads blocked, adding members |
| `test_access.py` | 10 | A statement is hidden unless every source behind it is visible, drafts and rejected claims never shown |
| `test_importers.py` | 11 | Each source type, empty and unreadable files, bad JSON, binary files |
| `test_sources_api.py` | 10 | Upload, listing, source access levels passed to pieces, size and type checks, no uploads after approval |
| `test_pipeline.py` | 29 | Quote check, fabricated and unknown citations dropped, verifier verdicts, conflicts, claims nobody backs up, gaps, bad model output, retries, rate limits, the second model, the Gemini and Groq clients, sources the first request skipped |
| `test_analysis_api.py` | 14 | Labels and dropped claims, questions ordered by risk, restricted evidence hidden, saved and basic fallbacks, re-runs, lost runs |
| `test_review_flow.py` | 37 | Answering, review actions and versions, approval rules, the incoming view, redaction, receipt, who may do what |
| `test_redact.py` | 6 | Emails, phone numbers, secrets, and things that must not be masked such as dates |
| `test_config.py` | 5 | Database URL handling, refusing to start in deployment with a weak secret |
| `test_health.py` | 1 | Health check |

## Real AI run on the synthetic project

Run by hand with `gemini-3.1-flash-lite` on all sources of the synthetic Campus Events App (9 sources, 128 pieces) and scored against `data/synthetic/answer_key.json`, which plants 32 cases.

| Measure | Result |
| --- | --- |
| Time | about 20 seconds, in AI mode |
| Statements produced | 36 (25 verified, 4 unverified, 6 missing, 1 conflicting) |
| Questions for the departing member | 6 |
| Claims thrown away because the quote was not in the source | 1 |
| Planted cases cited by at least one statement | 25 of 32 |
| Planted cases that ended with the label the key expects | 20 of 32 |

Same input gave the same result on repeat runs (temperature 0). The scoring is a script that matches a case to a statement by the source location it cites, and it counts a case as labelled correctly if any statement citing that location has the expected label. It is a generous, rough measure, not a judgement of the wording.

What we learned and changed:

- The first prompt found 10 statements. Telling the model to cover every source, and what counts as a gap or a claim only the leaver makes, raised it to 36.
- A long request makes the model skip whole sources, such as the HR notes. Any source nothing cites is now sent again on its own.
- The answer key counts document paragraphs after the title block, the importer counts the title block too, so the key's "paragraph 1" is the importer's "paragraph 2". The scoring allows for that.

Still wrong or missing:

- None of the four claims only the leaver makes was labelled unverified: one (chat message 32) was not found, and three were labelled verified because the model did not mark them as unbacked claims.
- Only one of the three planted conflicts (the auditorium capacity) was reported as conflicting. The other two, the token lifetime and the QR format, were missed or shown as ordinary statements.
- Some unowned tasks and undocumented dependencies were reported as plain statements instead of gaps.

A successful run is saved to `backend/saved_results/campus-events-app.json`. With a wrong API key, the app showed the same 36 statements in "saved" mode with a notice, which is the fallback a judge sees if the AI service is down.

## Main journeys covered

- Lead connects sources, runs an analysis, the departing member answers, the lead reviews and approves, the incoming member reads the handover and confirms receipt (`test_review_flow.py`).
- A conflict between two sources is found, blocks approval, is resolved with a reason, and only the chosen source reaches the incoming member.
- A gap is left open (skipped) or accepted by the lead and still shows as an open question to the incoming member.

## Failure cases covered

| Case | Result |
| --- | --- |
| Source file empty or unreadable | Reported with a note, nothing guessed from it |
| No readable source at all | Analysis refused |
| Model cites a quote that is not in the source | The claim is dropped and counted |
| Model returns broken or wrongly shaped JSON | Treated as a failure, falls back |
| AI service down | Retries, second model, then saved results, then a basic listing, with a notice |
| Analysis lost mid-run (server restart) | Treated as failed after 10 minutes, new analysis allowed |
| Departing member does not answer | The gap stays open and visible |
| Two sources conflict | Both shown until the lead resolves it, approval blocked |
| Lead does not approve | The incoming member sees nothing (`409`) |
| Weak secret in a deployed setup | The app refuses to start |

## Permission and leakage tests

- A question built from a lead-only source is hidden from the departing member, and they cannot answer it.
- A statement built from one open and one restricted source is hidden from the incoming member.
- The incoming member never sees drafts, rejected claims or the source the lead did not choose.
- The lead's preview of the handover is identical to what the incoming member gets.
- Every endpoint is checked for `401` without sign-in and `403` for the wrong role, including outsiders.
- Secrets, emails and phone numbers are masked for the incoming member and not for the lead.

## Not tested yet

Being honest about the gaps:

- **The AI in the automated tests.** The test suite never calls a real model. The real AI was run by hand on the synthetic project, see below.
- **Stronger models.** `gemini-3.6-flash` returned broken JSON on the same request and the app fell back to the basic listing. We use `gemini-3.1-flash-lite`.
- **A deployed instance.** `render.yaml` is written but nothing is deployed to Render yet.
- **The frontend.** Integration with Kishan's screens has not been tested.
- **Load and long inputs.** A very large repository would need chunking, which is not built.

## Structured feedback

None collected yet. The script, questions and a table to fill in are in [`FEEDBACK.md`](FEEDBACK.md). To add before submission: a short walkthrough with one or two people outside the team using the synthetic project, with what confused them and what changed afterwards.
