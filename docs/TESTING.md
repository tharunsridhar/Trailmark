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

149 tests, all passing on both SQLite (about 2 minutes) and PostgreSQL 16 (about 4 minutes). Most of the time is password hashing.

Also checked by hand: the Docker image builds, and with `docker compose up` the backend container ran against Postgres, answered `/health`, registered a user, created a handover, and returned `401` without a login.

| File | Tests | What it covers |
| --- | --- | --- |
| `test_auth.py` | 8 | Register, login, logout, wrong password, duplicate email, short password, bad or missing token |
| `test_handovers.py` | 11 | Creator becomes lead, roles, outsiders and non-leads blocked, adding members |
| `test_access.py` | 10 | A statement is hidden unless every source behind it is visible, drafts and rejected claims never shown |
| `test_importers.py` | 11 | Each source type, empty and unreadable files, bad JSON, binary files |
| `test_sources_api.py` | 10 | Upload, listing, source access levels passed to pieces, size and type checks, no uploads after approval |
| `test_pipeline.py` | 35 | Quote check, fabricated and unknown citations dropped, verifier verdicts, conflicts, claims nobody backs up, claims only the leaver makes, gaps, bad model output, retries, rate limits, the second model, the Gemini and Groq clients, sources the first request skipped |
| `test_analysis_api.py` | 14 | Labels and dropped claims, questions ordered by risk, restricted evidence hidden, saved and basic fallbacks, re-runs, lost runs |
| `test_review_flow.py` | 37 | Answering, review actions and versions, approval rules, the incoming view, redaction, receipt, who may do what |
| `test_redact.py` | 6 | Emails, phone numbers, secrets, and things that must not be masked such as dates |
| `test_config.py` | 5 | Database URL handling, refusing to start in deployment with a weak secret |
| `test_health.py` | 1 | Health check |

## Real AI run on the synthetic project

Run by hand on all sources of the synthetic Campus Events App (9 sources, 128 pieces) and scored against `data/synthetic/answer_key.json`, which plants 32 cases. The scoring is a script that matches a case to a statement by the source location it cites, and it counts a case as labelled correctly if any statement citing that location has the expected label. It is a generous, rough measure, not a judgement of the wording.

| Model (Gemini, free tier) | Runs | Cases cited (of 32) | Expected label (of 32) |
| --- | --- | --- | --- |
| `gemini-3.1-flash-lite` | 2, identical | 25 | 20 |
| `gemini-3.5-flash-lite` | 1 | 26 | 12 |
| `gemini-3.5-flash` | 1 | 26 | 23 |
| `gemini-3.6-flash` (the default) | 5 | 24 to 29, usually 24 | 18 to 27 |

The default model gives a different answer from run to run, so the saved demo result is one real run, not an average. It took about 30 seconds in AI mode.

**The saved run** (`backend/saved_results/campus-events-app.json`): 82 statements (36 verified, 31 unverified, 13 missing, 2 conflicting), 13 questions for the departing member. 30 of 32 cases cited, 25 with the expected label. All four planted claims only the leaver makes are `unverified`, two of the three planted conflicts (auditorium capacity, QR format) are reported as conflicts, and the HR notes and the confidential lead chat were found.

The result changes from run to run. Three runs with the final prompt cited 24, 31 and 30 cases and matched the expected label on 10, 24 and 25, with 37, 72 and 82 statements. In two of those three runs all four leaver claims came out `unverified`. The saved file is one of the better runs, picked because it shows every feature (conflicts, gaps, unverified claims), and it is a real run, not edited.

What we learned and changed:

- The first prompt found 10 statements. Telling the model to cover every source, and what counts as a gap or a claim only the leaver makes, raised it to 35 or more.
- A long request makes models skip whole sources, such as the HR notes. Any source nothing cites is now sent again on its own.
- Thinking models count their thinking against the reply limit and cut the JSON off. Setting `reasoning_effort` to low fixed that for `gemini-3.6-flash`.
- Something only the departing member says in chat, with nothing else behind it, can no longer be `verified`. This is a rule in code, not a request to the model. It also means a decision only the leaver stated, such as "we chose Render", shows as `unverified` until another person or a document backs it.
- The model often skipped the leaver's own claims in the long request, so their chat messages now get a short request of their own.
- Asking the model to leave out routine commits (typos, version pins, small screens) did not reliably shorten the list, but coverage went up. Plain commits are still often listed as decisions.
- Splitting the work into two requests (facts, then checks) and a longer checking prompt did not help, so they were not kept.
- The answer key counts document paragraphs after the title block, the importer counts the title block too, so the key's "paragraph 1" is the importer's "paragraph 2". The scoring allows for that.

Still wrong or missing in the saved run:

- The third planted conflict (token lifetime of 60 or 15 minutes) was found but labelled verified instead of conflicting.
- One unfinished item (the stalled task T09 export) and one contact (the student council liaison) were not found.
- Many plain commits are labelled `decision` although they only record work done, so the lead has a long list to review.
- The free tier of the AI service sometimes answers "high demand" (503), and some runs took several minutes because of retries. That is why a second model and saved results exist.

**Hand check of the verified labels.** From the saved run, 20 of the 36 verified statements were picked at random (fixed seed) and each quote was read against its statement. In all 20 the quote supports the statement. This was done by the team's AI assistant and not by an outside reviewer, and it is a small sample, so it shows the check is working but is not a measured error rate. Two weaknesses were seen:

- "Verified" means the quoted words support the statement, not that the statement is the whole truth. A true statement can be one side of a conflict that was reported separately, such as the token lifetime of 60 minutes.
- A statement built from the restricted HR notes can be verified. It is shown only to the lead, because it inherits the restriction of its source.

With a wrong API key, the app showed the same 82 statements and 13 questions in "saved" mode with a notice, which is what a judge sees if the AI service is down.

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
- **A deployed instance.** `render.yaml` is written but nothing is deployed to Render yet.
- **The frontend.** Integration with Kishan's screens has not been tested.
- **Load and long inputs.** A very large repository would need chunking, which is not built.

## Structured feedback

None collected yet. The script, questions and a table to fill in are in [`FEEDBACK.md`](FEEDBACK.md). To add before submission: a short walkthrough with one or two people outside the team using the synthetic project, with what confused them and what changed afterwards.
