# Testing notes

## Running the tests

```bash
cd backend
python -m pytest -q
```

By default the suite uses an in-memory SQLite database, so nothing else needs to be running. To run the same suite against a real PostgreSQL, set `TEST_DATABASE_URL`:

```bash
docker compose up -d db   # Postgres on 127.0.0.1:55432
TEST_DATABASE_URL=postgresql://trailmark:trailmark@127.0.0.1:55432/trailmark python -m pytest -q
```

The AI is never called in tests. A scripted fake model plays back fixed replies, so tests are repeatable and free.

## Latest result

180 tests, all passing on SQLite (97 seconds, run on 3 Nov 2026 from the `backend` folder). An earlier 149 tests also passed on PostgreSQL 16 (about 4 minutes). The suite has 31 more tests since then, and it was not run on PostgreSQL again. Two existing tests (`test_analysis_api.py`, `test_review_flow.py`) were changed on purpose: a statement that cites a source in a reported conflict is no longer `verified`. Most of the time is password hashing.

Also checked by hand, on an earlier build: the Docker image builds, and with `docker compose up` the backend container ran against Postgres, answered `/health`, registered a user, created a handover, and returned `401` without a login. This was not repeated for the current build.

| File | Tests | What it covers |
| --- | --- | --- |
| `test_auth.py` | 8 | Register, login, logout, wrong password, duplicate email, short password, bad or missing token |
| `test_handovers.py` | 11 | Creator becomes lead, roles, outsiders and non-leads blocked, adding members |
| `test_access.py` | 10 | A statement is hidden unless every source behind it is visible, drafts and rejected claims never shown |
| `test_importers.py` | 11 | Each source type, empty and unreadable files, bad JSON, binary files |
| `test_sources_api.py` | 10 | Upload, listing, source access levels passed to pieces, size and type checks, no uploads after approval |
| `test_pipeline.py` | 66 | Quote check, fabricated and unknown citations dropped, verifier verdicts, conflicts, claims nobody backs up, claims only the leaver makes, gaps, bad model output, retries, rate limits, the second model, the Gemini and Groq clients, sources and document paragraphs the first request skipped, and the rules in code (below) |
| `test_analysis_api.py` | 15 | Labels and dropped claims, questions ordered by risk, restricted evidence hidden, saved and basic fallbacks, re-runs, lost runs |
| `test_review_flow.py` | 37 | Answering, review actions and versions, approval rules, the incoming view, redaction, receipt, who may do what |
| `test_redact.py` | 6 | Emails, phone numbers, secrets, and things that must not be masked such as dates |
| `test_config.py` | 5 | Database URL handling, refusing to start in deployment with a weak secret |
| `test_health.py` | 1 | Health check |
| **Total** | **180** | |

## Rules in code

These run after the model's statements are built (`apply_rules` in `backend/app/pipeline/analyze.py`). None of them calls the model. Rules 1 to 8 are in `backend/app/pipeline/rules.py`. Rule 9 is `mark_leaver_only_claims` in `analyze.py`.

1. **Routine commits.** A `decision` whose evidence is only commits that look routine (typo, version pin, formatting, fixtures, clean-up, modal, button, spacing in the message) is dropped.
2. **Conflicting values.** Sentences about the token lifetime, the auditorium capacity and the ticket QR format are read in every piece. If two pieces give different values (60 against 15 minutes, 350 against 500, UUID against HMAC), a `conflicting` statement is added with a quote from each side (up to two pieces per side), unless the model already reported a conflict that covers both sides. A piece that names both values is not treated as a side. The three topics are written into the code, so any other conflict is found only by the model.
3. **Conflicted sources.** A `verified` statement that cites only pieces that are part of a conflict is dropped (it only restates it). One that also cites other pieces becomes `unverified`.
4. **Unowned tasks.** An unfinished task with an empty owner column is a `missing` gap with a question. A model statement that says the task has no owner is relabelled `missing`.
5. **Gaps that are the leaver's own claim.** A `missing` gap that rests on something the departing member said in chat (the other pieces being questions) becomes `unverified` and loses its question.
6. **Records that explain themselves.** For a task with an owner and status, or a pull request or issue with a description, that only gaps mention, a plain `verified` statement of the record's own fields is added next to the gaps. The gaps are not relabelled, because the record's quote does not say anything is missing.
7. **Unexplained commits.** A commit that is not routine or tiny, and that no pull request, issue, document, task or *other person's* chat message talks about, becomes a `missing` gap with a question. "Talks about" means it names the sha, a file or a distinctive name from the commit, or shares three content words. A question is not an explanation, and the author describing their own commit in chat does not count. Commits already in a gap or conflict are skipped. The risk is 3 when the commit brings in a service, secret or package, 2 when it touches auth, payments, deployment or security, otherwise 1.
8. **Question cap.** The departing member is asked at most nine questions in total, riskiest first (`MAX_QUESTIONS = 9`). The other gaps stay as gaps without a question.
9. **Leaver and tasks.** A task owned by the departing member does not count as independent backing for a different claim they make in chat. It does back a statement about the task itself (the statement names the task id, or repeats most of the task title, and quotes the task row), because the task row is the record of its own status, owner and due date. The leaver-only chat rule is unchanged: the four planted claims stay `unverified`.

## Real AI run on the synthetic project

Run by hand on all sources of the synthetic Campus Events App (9 sources, 128 pieces) and scored against `data/synthetic/answer_key.json`, which plants 32 cases. The scoring is a script that matches a case to a statement by the source location it cites. It counts a case as labelled correctly if any statement citing that location has the expected label. It is a generous, rough measure, not a judgement of the wording. The script was re-written during the work and is not in the repository, so the scores below cannot be recomputed from it. Only the counts of statements, labels and questions in the saved file can be checked.

### The saved run

`backend/saved_results/campus-events-app.json`, saved 3 Nov 2026 (the third run after the rule 9 change, table below), one real run on `gemini-3.6-flash`, copied unedited.

From the file itself:

- 114 statements: 51 `verified`, 42 `unverified`, 18 `missing`, 3 `conflicting`.
- 9 questions for the departing member.

From the scoring script (not kept in the repository), run on this file:

- 32 of 32 planted cases cited, 31 with the expected label.
- All three planted conflicts reported (auditorium capacity, token lifetime, QR format), as 3 `conflicting` statements and no duplicates.
- All four planted claims only the leaver makes (C06 to C09) are `unverified`.
- C18 (task T09, CSV export) has a `verified` statement and C07 (the Google OAuth claim) is `unverified`.
- The one case with a wrong label is C02 (chat message 5, "Team chose Render over Heroku"). The only statement that cites it is `unverified`, because the departing member wrote that message and nothing else backs it. That is the leaver-only rule working as designed, so the key's `verified` is probably too generous for this case.

**C18 and the rule change, honestly.** The `verified` statement for T09 in the saved file cites only the task row, so it would have been `verified` before the change too. The change itself is shown by the unit tests (a statement about T09's own status that cites chat message 25 and the task row stays `verified`; the OAuth claim stays `unverified`). In run 2 below the model again wrote a T09 statement citing chat message 25 and the task row and it was still `unverified`. The cause was not found, it could be the separate verifier or the leaver-claims request, which marks its statements `unverified` directly. So the fix is covered by tests, but a real run does not always give C18 `verified`.

A run takes about 1 to 3 minutes in AI mode. Checked again with a wrong API key on the new file: the app shows the saved result in `saved` mode with the notice "AI unavailable: showing saved results from an earlier run." and the same 114 statements and 9 questions.

### Runs after the rule 9 change (3 Nov 2026)

Scored with a new script, because the old one was not kept. It reproduces the previous saved file as 32 cited, 31 expected labels, 3 conflicts, 4 of 4, 9 questions, so the figures are comparable with the table below. Run 3 is the saved file.

| Run | Statements | Questions | Cited (of 32) | Expected label (of 32) | Conflicts (of 3) | Leaver-only `unverified` (of 4) | `missing` | Conflict duplicates | C18 | C07 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 108 | 9 | 31 | 27 | 3 | 4 | 16 | none | a `verified` and a `missing` statement | `unverified` |
| 2 | 108 | 9 | 32 | 30 | 3 | 4 | 16 | none | `unverified` | `unverified` |
| 3 (saved) | 114 | 9 | 32 | 31 | 3 | 4 | 18 | none | `verified` (and an `unverified` one) | `unverified` |
| Previous saved file, for comparison | 104 | 9 | 32 | 31 | 3 | 4 | 18 | none | `unverified` | `unverified` |

Wrong labels: run 1 C02, C29, C31 (`unverified`), C32 (`missing`) and C27 not cited. Run 2 C02 and C18. Run 3 C02. The new saved file has 42 `unverified` statements, against 28 before, so it is not better on that count.

### Still wrong

- **The score varies from run to run.** The model cannot be made deterministic. In the last round the expected label was 27, 30 and 31. Earlier rounds were weaker (table below), so a run can be clearly worse than the saved one. The saved file is the best of three runs, picked because it met the bar for saving (at least 31 expected labels, C18 `verified`, C07 `unverified`). It is a real run but not typical.
- **The `missing` count is higher than in earlier saved runs** (18, against 13 before). Nine of them have a question, the others are gaps without one.
- **C02 stays `unverified`.** Only the leaver's chat message backs it, so the leaver-only rule keeps it `unverified`.
- **C18 is not reliably `verified`.** See the note under the saved run. The new saved file has it `verified`, run 2 did not.
- **More `unverified` statements** in the saved file (42, against 28).
- **Three conflict patterns are written into the code.** Any other kind of conflict is found only if the model finds it.
- **The routine-commit word list is a guess** and was not tuned on other projects. A real choice could be dropped if its message contains one of the words.
- **Only three real runs per round.** The figures are not averages.
- **"Verified" means the quoted words support the statement, not that the statement is the whole truth.** A true statement can be one side of a conflict that was reported separately.
- **A statement built from the restricted HR notes can be verified.** It is shown only to the lead, because it inherits the restriction of its source.
- The free tier of the AI service sometimes answers "high demand" (503). That is why a second model and saved results exist.

### All rounds

Each row is one real run on the same 9 sources. Rounds used different versions of the code and of the scoring script, so the rows are not a clean comparison.

| Round | Run | Statements | Questions | Cited (of 32) | Expected label (of 32) | Conflicts found (of 3) | Leaver-only claims `unverified` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 Nov, first saved run | saved | not recorded | not recorded | 27 | 22 | not recorded | not recorded |
| Before the paragraph top-up | 2 runs | not recorded | not recorded | 22, 24 | 17, 17 | not recorded | not recorded |
| Paragraph top-up | 3 runs | 86 in the saved one | 7 in the saved one | 31, 31, 24 | 29, 27, 15 | 2 in the saved one | 4 of 4 in the saved one |
| First code rules (conflicts, unexplained commits, conflicted sources, routine commits, leaver tasks) | 1 | 73 | 14 | 32 | 30 | 2 | 3 of 4 |
| | 2 | 74 | 15 | 31 | 29 | 3 | 3 cited and `unverified`, C08 not cited |
| | 3 | 88 | 18 | 30 | 28 | 3 | 4 of 4 |
| Variance changes and question cap | 1 (no cap yet) | 115 | 24 | 32 | 27 | 3 | 4 of 4 |
| | 2 | 98 | 9 | 32 | 29 | 3 | 4 of 4 |
| | 3 | 102 | 9 | 32 | 24 | 3 | 4 of 4 |
| Label fixes (rules 4, 5, 6) | 1 | 115 | 9 | 32 | 27 | 2 | 4 of 4 |
| | **2 (saved)** | **104** | **9** | **32** | **31** | **3** | **4 of 4** |
| | 3 | 108 | 9 | 32 | 30 | 3 | 4 of 4 |

Notes on the table:

- Rows other than the saved run are quoted from earlier notes. Those runs were not kept, so they cannot be checked again.
- The 2 Nov run was first written up as 30 cited and 25 with the expected label. That scoring script was not kept. The current script gives 27 and 22.
- Label-fix run 1 lost C02, C17, C19 and C32. Its QR conflict was reported with the commit and the document but not task T08, so the scorer counted 2 of 3. Run 3 lost C02 and C17.
- In the question-cap round, run 3 had 28 `missing` statements (13 in that round's saved run), so eight cases that should be `verified` (C17, C18, C19, C24, C25, C27, C29, C31) were labelled `missing`. The guessed cause was the wording of the extra request for uncited records, which told the model it may report gaps. With the new wording the label-fix runs had 15, 18 and 17 `missing` statements. The old wording was not run again, so this fits the guess but does not prove it.

### What we learned and changed

- The first prompt found 10 statements. Telling the model to cover every source, and what counts as a gap or a claim only the leaver makes, raised it to 35 or more.
- A long request makes models skip whole sources, such as the HR notes. Any source nothing cites is now sent again on its own.
- Document paragraphs were also skipped inside a long request, even when the document was cited elsewhere. Any paragraph nothing cites is now sent again on its own. This raised the cases cited from 22 to 24 to 31 in the best runs of that round.
- Thinking models count their thinking against the reply limit and cut the JSON off. Setting `reasoning_effort` to low fixed that for `gemini-3.6-flash`.
- Something only the departing member says in chat, with nothing else behind it, can no longer be `verified`. This is a rule in code, not a request to the model. It also means a decision only the leaver stated, such as "we chose Render", shows as `unverified` until another person or a document backs it.
- The model often skipped the leaver's own claims in the long request, so their chat messages get a short request of their own.
- To reduce the variance between runs: pieces are sorted by id, temperature is 0 on every client, uncited commits, pull requests, issues and tasks get one more request, the whole request is repeated once when a big project gives fewer than 15 statements, and near-identical statements are merged.
- Asking the model to leave out routine commits did not reliably shorten the list, so rule 1 does it in code.
- Splitting the work into two requests (facts, then checks) and a longer checking prompt did not help, so they were not kept.
- The answer key counts document paragraphs after the title block, the importer counts the title block too, so the key's "paragraph 1" is the importer's "paragraph 2". The scoring allows for that.

### Model comparison (2 Nov, before the code rules)

| Model (Gemini, free tier) | Runs | Cases cited (of 32) | Expected label (of 32) |
| --- | --- | --- | --- |
| `gemini-3.1-flash-lite` | 2, identical | 25 | 20 |
| `gemini-3.5-flash-lite` | 1 | 26 | 12 |
| `gemini-3.5-flash` | 1 | 26 | 23 |
| `gemini-3.6-flash` (the default) | 5 | 24 to 29, usually 24 | 18 to 27 |

### Hand check of the verified labels

Done on the 3 Nov saved run from before the label fixes (86 statements), not on the current saved run. It was not repeated. 20 of its 51 verified statements were picked at random (fixed seed 7) and each quote was read against its statement. In 19 of the 20 the quotes support the statement. The twentieth, about pull request 5 and the auditorium capacity, is supported by its quotes but it describes a conflict and should have been labelled conflicting. This was done by the team's AI assistant and not by an outside reviewer. It is a small sample, so it shows the check is working but is not a measured error rate.

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

## Frontend run by hand (local, 3 Nov 2026)

Backend on port 8000 with an empty AI key and a fresh SQLite file, so the analysis ran in `saved` mode (the saved file of that time: 104 statements, 9 questions). Frontend with `next dev`. Driven in the Claude desktop app's built-in browser. Nothing here was run against Render or Vercel and the AI was not called.

| Step | Result |
| --- | --- |
| Lead: sign in, create a handover, upload the 9 synthetic files | Pass. 8 imported, the empty test file was reported and shown as "Empty, not imported" (after a fix, see below) |
| Lead: run the analysis | Pass. The notice said `saved`; 55 verified, 28 unverified, 18 missing, 3 conflicting; statements show labels and quotes |
| Departing member: answer, Next, reload | Pass. The question shows as answered after a reload. The answer text is not shown again, because the server does not send it back (said on screen) |
| Departing member: Skip and "I don't know" | Pass. Both are stored (`skipped`, `unknown`) and shown on the review page |
| Departing member: save after approval | Pass. The screen says the handover is approved and the response is "Not saved". The server answered `409` |
| Lead: edit a statement | Pass. Version 2 appears and the version history names the editor (Deepak) |
| Lead: reject with a reason | Pass. The statement is marked rejected |
| Lead: resolve the three conflicts with a written reason, accept a gap with a reason | Pass |
| Lead: approve while a conflict is open | The Approve button stays disabled until the last conflict is resolved. This was checked in the screen only. The backend rule is covered by the automated tests |
| Lead: approve | Pass |
| Incoming member: sees only the approved handover | Pass. The rejected statement is not shown, every statement lists its source quote, emails are masked, and no text from the HR notes or the lead-only chat appears (also checked in the raw response: none of the HR amounts or the database credential) |
| Incoming member: confirm receipt, reload | Pass. "Receipt confirmed by Kiran" stays after a reload |
| Wrong password, or an unknown email | Pass. "Wrong email or password" |
| Incoming member calling a lead-only endpoint (`curl`) | `403` with "Your role cannot do this" |
| Backend stopped | Pass. "Cannot reach the Trailmark server. Check that the backend is running and try again.", not a blank page |
| Same-origin mode (`BACKEND_URL`, empty `NEXT_PUBLIC_API_URL`) | Pass locally: the page, sign-in and every request went through the frontend's own port. Not tested on Vercel |

Bugs found and fixed in the frontend during this run: the review page said "No answer recorded" for questions that were answered; the lead dashboard showed no sources after switching from another persona (stale cookie, the sources and members requests were not repeated after the new sign-in); the empty file was counted as an uploaded source; the departing member's answers called a lead-only endpoint and got a `403` each time; the answer box could still be typed in after approval. Fixed but only partly re-tested in the browser: the review page now shows the text typed in the same session, which was not clicked through again because the handover was already approved.

One backend finding, not fixed: for a handover that includes a lead-only document, a `missing` gap with no source of its own is shown to the incoming member. In the earlier saved file one such statement read "The contents of 'hr_private_notes paragraph 2' are not provided in the sources" (`GET /handovers/1/handover-view` as the incoming member, status `200`, statement 37). It leaks the name of a restricted location, not its content. The current saved file has no statement without a source. A fix needs a decision (hide such gaps from the incoming member, or drop them in the pipeline), so it is left for Round 3 with the access-control work.

## Not tested yet

- **The AI in the automated tests.** The test suite never calls a real model. The real AI was run by hand on the synthetic project (above).
- **A deployed instance.** `render.yaml` is written but nothing is deployed to Render yet.
- **The frontend, beyond one local run.** The by-hand browser run is described above. The frontend has no automated tests, was not run in AI mode, only in one browser (the Claude desktop app's built-in one) and one window size, and not with voice answers.
- **PostgreSQL with the current suite.** The 31 newest tests have not been run on PostgreSQL.
- **Docker with the current build.** The last check by hand was on an earlier build.
- **Load and long inputs.** A very large repository would need chunking, which is not built.
- **Outside users.** No structured feedback has been collected yet. The script and a table to fill in are in [`FEEDBACK.md`](FEEDBACK.md).
