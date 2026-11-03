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

197 tests, all passing on SQLite (about 10.6 minutes with other sessions running tests at the same time, run on 3 Nov 2026 from the `backend` folder). The first 192 also passed on PostgreSQL 16 from `docker compose` (`TEST_DATABASE_URL`, about 10.8 minutes), with no PostgreSQL-only failure. The 5 tests added after that (the restricted-name rule, `test_pipeline.py`) use no database and were not run on PostgreSQL. Two existing tests (`test_analysis_api.py`, `test_review_flow.py`) were changed on purpose: a statement that cites a source in a reported conflict is no longer `verified`. Most of the time is password hashing.

Also checked by hand on the current backend code (3 Nov 2026): `docker compose build backend` and `up` ran the backend against Postgres. `GET /health` returned `{"status": "ok"}`, a user registered (`201`), a handover was created (`201`), and `GET /handovers` without a login returned `401`. With a wrong `LLM_API_KEY` and the nine synthetic files uploaded, the analysis finished in `saved` mode with the notice "AI unavailable: showing saved results from an earlier run." and 114 statements (51 verified, 42 unverified, 18 missing, 3 conflicting), none without a source, and 9 questions for the lead. The frontend image was not built in this check.

| File | Tests | What it covers |
| --- | --- | --- |
| `test_auth.py` | 8 | Register, login, logout, wrong password, duplicate email, short password, bad or missing token |
| `test_handovers.py` | 11 | Creator becomes lead, roles, outsiders and non-leads blocked, adding members |
| `test_access.py` | 13 | A statement is hidden unless every source behind it is visible, drafts and rejected claims never shown, a statement or question with no source of its own is neutral or hidden |
| `test_privacy.py` | 9 | Restricted names never reach the incoming member (see below), for every role |
| `test_importers.py` | 11 | Each source type, empty and unreadable files, bad JSON, binary files |
| `test_sources_api.py` | 10 | Upload, listing, source access levels passed to pieces, size and type checks, no uploads after approval |
| `test_pipeline.py` | 71 | Quote check, fabricated and unknown citations dropped, verifier verdicts, conflicts, claims nobody backs up, claims only the leaver makes, gaps, bad model output, retries, rate limits, the second model, the Gemini and Groq clients, sources and document paragraphs the first request skipped, the rules in code (below), and restricted names removed from statements and questions |
| `test_analysis_api.py` | 15 | Labels and dropped claims, questions ordered by risk, restricted evidence hidden, saved and basic fallbacks, re-runs, lost runs |
| `test_review_flow.py` | 37 | Answering, review actions and versions, approval rules, the incoming view, redaction, receipt, who may do what |
| `test_redact.py` | 6 | Emails, phone numbers, secrets, and things that must not be masked such as dates |
| `test_config.py` | 5 | Database URL handling, refusing to start in deployment with a weak secret |
| `test_health.py` | 1 | Health check |
| **Total** | **197** | |

## Rules in code

These run after the model's statements are built (`apply_rules` in `backend/app/pipeline/analyze.py`). None of them calls the model. Rules 1 to 8 and 10 are in `backend/app/pipeline/rules.py`. Rule 9 is `mark_leaver_only_claims` in `analyze.py`.

1. **Routine commits.** A `decision` whose evidence is only commits that look routine (typo, version pin, formatting, fixtures, clean-up, modal, button, spacing in the message) is dropped.
2. **Conflicting values.** Sentences about the token lifetime, the auditorium capacity and the ticket QR format are read in every piece. If two pieces give different values (60 against 15 minutes, 350 against 500, UUID against HMAC), a `conflicting` statement is added with a quote from each side (up to two pieces per side), unless the model already reported a conflict that covers both sides. A piece that names both values is not treated as a side. The three topics are written into the code, so any other conflict is found only by the model.
3. **Conflicted sources.** A `verified` statement that cites only pieces that are part of a conflict is dropped (it only restates it). One that also cites other pieces becomes `unverified`.
4. **Unowned tasks.** An unfinished task with an empty owner column is a `missing` gap with a question. A model statement that says the task has no owner is relabelled `missing`.
5. **Gaps that are the leaver's own claim.** A `missing` gap that rests on something the departing member said in chat (the other pieces being questions) becomes `unverified` and loses its question.
6. **Records that explain themselves.** For a task with an owner and status, or a pull request or issue with a description, that only gaps mention, a plain `verified` statement of the record's own fields is added next to the gaps. The gaps are not relabelled, because the record's quote does not say anything is missing.
7. **Unexplained commits.** A commit that is not routine or tiny, and that no pull request, issue, document, task or *other person's* chat message talks about, becomes a `missing` gap with a question. "Talks about" means it names the sha, a file or a distinctive name from the commit, or shares three content words. A question is not an explanation, and the author describing their own commit in chat does not count. Commits already in a gap or conflict are skipped. The risk is 3 when the commit brings in a service, secret or package, 2 when it touches auth, payments, deployment or security, otherwise 1.
8. **Question cap.** The departing member is asked at most nine questions in total, riskiest first (`MAX_QUESTIONS = 9`). The other gaps stay as gaps without a question.
9. **Leaver and tasks.** A task owned by the departing member does not count as independent backing for a different claim they make in chat. It does back a statement about the task itself (the statement names the task id, or repeats most of the task title, and quotes the task row), because the task row is the record of its own status, owner and due date. The leaver-only chat rule is unchanged: the four planted claims stay `unverified`.
10. **Restricted places.** Last of all, `hide_restricted_names` looks for the name of any source that the departing or the incoming member may not read, in every statement and question: its display name (with and without the bracket), its file name, the file name with a paragraph number, a locator no open source also uses, and loose forms made of the words of the source title ("Confidential HR notes document"). With nothing open behind the statement, the whole text becomes a neutral sentence ("A restricted source raises a point that is not documented in the shared sources.") and the question a neutral question. With an open source also behind it, only the name is replaced by "a restricted source". Quotes and sources are not touched, they stay behind the statement's own access check. The prompt also tells the model not to write file names, paths, paragraph numbers or source titles. This closes the leak found in the hand run, where a gap without a source read "The contents of 'hr_private_notes paragraph 2' are not provided in the sources".

## Real AI run on the synthetic project

Run by hand on all sources of the synthetic Campus Events App (9 sources, 128 pieces) and scored against `data/synthetic/answer_key.json`, which plants 32 cases. The scoring is a script that matches a case to a statement by the source location it cites. It counts a case as labelled correctly if any statement citing that location has the expected label. It is a generous, rough measure, not a judgement of the wording. The script is now in the repository: `python tests/score_run.py <file>` from the `backend` folder scores a saved or fresh result, and `python tests/run_real_pipeline.py <outdir>` makes one real run into a folder without touching the saved file. Scores in the rounds before 3 Nov were made with older scripts that were not kept, so those rows cannot be recomputed.

### Key location audit (3 Nov 2026)

The key counts document paragraphs without the title block; the importer counts it, so the scorer uses key paragraph + 1. For each of the 10 cases whose source is a markdown document, the document was split the way `backend/app/importers.py` splits it and compared with the case's `description` (word overlap, 1.00 = every word of the description is in that paragraph).

| Case | Key location | Scorer looks at | Paragraph where the text is | Overlap there | Match |
| --- | --- | --- | --- | --- | --- |
| C01 | architecture_overview.md paragraph 1 | 2 | 2 | 1.00 | yes |
| C04 | meeting_notes_august.md paragraph 1 | 2 | 2 | 0.93 | yes |
| C21 | meeting_notes_august.md paragraph 2 | 3 | 3 | 1.00 | yes |
| C22 | meeting_notes_august.md paragraph 2 | 3 | 3 | 1.00 | yes |
| C23 | meeting_notes_august.md paragraph 2 | 3 | 3 | 0.90 | yes |
| C26 | deployment_guide.md paragraph 3, chat message 9 | 4 | 5 | 1.00 (0.00 in 4) | **no** |
| C28 | deployment_guide.md paragraph 3 | 4 | 5 | 1.00 (0.08 in 4) | **no** |
| C29 | hr_private_notes.md paragraph 1 | 2 | 2 | 0.73 | yes |
| C30 | hr_private_notes.md paragraph 2 | 3 | 3 | 0.90 | yes |
| C31 | hr_private_notes.md paragraph 1 | 2 | 2 | 0.27 (generic description) | yes |

Key location for C28 corrected from paragraph 3 to paragraph 4, because the description text ("For production database restore access and escalated permissions, contact Deepak") is in the contacts paragraph (importer paragraph 5, key paragraph 4) of the deployment guide. Paragraph 4 in the importer's count, which the old key pointed to, is the note about the persistent volume. The earlier score of 31 counted C28 wrong because of this: the saved run's statement for the contact line was `verified` and quoted it word for word, but it cites paragraph 5 and the scorer was looking at paragraph 4. The same mistake was in C26 (the Ravi contact line is in the same paragraph); it was corrected the same way. C26 was never counted wrong, because its key also lists chat message 9, which the saved run cites. Only the `location` field of these two cases changed: not the description, not the expected label. The AI's label was not changed or tuned. The key was not touched for any other case.

### The saved run

`backend/saved_results/campus-events-app.json`, saved 3 Nov 2026, run 3 of the three runs below (the runs after the restricted-location rule, rule 10), one real run on `gemini-3.6-flash`, copied unedited.

From the file itself:

- 106 statements: 54 `verified`, 31 `unverified`, 18 `missing`, 3 `conflicting`. Every statement cites at least one source.
- 9 questions for the departing member.
- No statement or question names a restricted source's file name, path, paragraph number or title (`hr_private_notes`, `lead_private_chat`, "HR Private Notes", "Lead 1-on-1 Chat"): the scorer counts 0. It counts the generic word "restricted" apart, and finds it in two statements: a `verified` one ("Deepak stated that the contractor exit bonus is tied to handover signoff, as referenced in a restricted source.") and a `missing` one ("The contents of 'a restricted source' are not provided in the sources."). Both cite only "Lead 1-on-1 Chat (Confidential)", which the manifest allows for the lead only, so the access layer hides them from the incoming member (`tests/test_analysis_api.py` and `tests/test_privacy.py`). The wording is rule 10's own neutral replacement. The word says that a restricted source exists, not which one, and only the lead sees it, so it was judged harmless and rule 10 was not changed. The scorer now reports the two measures separately and checks that each statement with the generic word cites only lead-only sources (0 do not).

From the scoring script, now in the repository (`backend/tests/score_run.py`), run on this file:

- 32 of 32 planted cases cited, 32 with the expected label (31 before the key location of C28 was corrected, see the audit above).
- All three planted conflicts reported (auditorium capacity, token lifetime, QR format), as 3 `conflicting` statements and no duplicates.
- All four planted claims only the leaver makes (C06 to C09) are `unverified`. C07 (the Google OAuth claim) is `unverified`.
- C18 (task T09, CSV export) has a `verified` statement.
- No case has a wrong label. C28 (deployment guide, contact Deepak for database restore access) had been counted wrong only because its key location pointed at the persistent-volume note; the saved file's statement for it is `verified` with a word-for-word quote. An earlier version of these notes described C28 as the persistent volume and a `missing` gap; that was wrong.

**C02 (chat message 5, "Team chose Render over Heroku").** In the previous saved file this was the one wrong label, and it was correct by design: only the departing member's message backed the statement, so the leaver-only rule kept it `unverified`. In this file C02 is `verified` because the statement also cites chat message 6, where Deepak (not the leaver) agrees ("Agreed, Render also links directly with our GitHub preview branches"). That is the rule working as intended, not weakened: a decision the leaver alone states stays `unverified`, and one a second person confirms can be `verified`. Whether the model cites message 6 together with message 5 changes from run to run. When it does not, C02 is `unverified`, which is the right label under the rule. The answer key says `verified` for C02, which is probably too generous for the case where only the leaver's message backs it. The key was not edited.

A run takes about 1 to 3 minutes in AI mode. Checked again with a wrong API key on the new file: the app shows the saved result in `saved` mode with the notice "AI unavailable: showing saved results from an earlier run." and the same 106 statements (54, 31, 18, 3).

### Runs after the restricted-location rule (3 Nov 2026)

Rule 10 (`hide_restricted_names` in `rules.py`) removes restricted names from statement and question text. The previous saved file contained "Confidential HR notes document content is completely restricted and inaccessible...", a `missing` statement that cited only the HR notes, so the pipeline output had changed and three real runs were made (the limit). They were scored with `backend/tests/score_run.py` and the key as it was then, which reproduced the previous saved file as 32 cited, 31 expected labels, 3 conflicts, 4 of 4, 9 questions, so the figures are comparable with the tables below.

| Run | Statements | Questions | Cited (of 32) | Expected label (of 32) | Conflicts (of 3) | Leaver-only `unverified` (of 4) | `missing` | Conflict duplicates | Restricted names in text | Wrong labels |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 88 | 9 | 30 | 29 | 3 | 3 | 15 | none | 0 | C02, C08 and C27 (the last two not cited) |
| 2 | 93 | 9 | 32 | 30 | 3 | 4 | 14 | none | one sourceless gap saying "a restricted source", one statement saying "HR and Lead Private Notes" | C29, C31 |
| 3 (saved) | 106 | 9 | 32 | 32 (31 with the old key) | 3 | 4 | 18 | none | none (no file name, path, paragraph number or title); the generic word in 2 lead-only statements | none (C28 under the old key) |
| Previous saved file, for comparison | 114 | 9 | 32 | 31 | 3 | 4 | 18 | none | 1 ("Confidential HR notes document...") | C02 |

**Re-scored with the corrected key (C28 and C26 locations):** only the saved file (run 3) still exists as a file, so it is the only one re-scored: 31 became 32 expected labels, with its other figures unchanged. Runs 1 and 2 and the previous saved file were not kept, so they are **not re-scored**; their C28 may have been counted wrong for the same reason, which cannot be checked now. The rows in the earlier-round tables below were made with older scripts and the old key and are also not re-scored. Their "restricted names" column used the older, broader pattern.

Only run 3 met the bar for replacing the saved file on every measure (32 cited, at least 31 expected labels, 3 conflicts, 4 of 4, 9 questions or fewer, no restricted names). Run 1 lost two cases and a leaver-only claim. Run 2 had 30 labels and kept a sourceless gap and a loose title in the text. Run 3 also has fewer `unverified` statements than before (31, against 42).

**The runs and the final code differ.** Two sessions wrote a rule for this at the same time. The three runs above were made with my first version, which replaced names with "a restricted source" and (after the runs) dropped gaps that only pointed at a closed source. The merged code keeps the other session's `hide_restricted_names`, which rewrites such a gap into a neutral sentence instead of dropping it, and adds a prompt line. The saved file was not produced by the merged code. It still has "The contents of 'a restricted source' are not provided in the sources.", citing only the lead-only chat, so the incoming member cannot see it. Nothing in the saved file names a restricted file, path, paragraph number or title (checked with `score_run.py`).

### Still limited

- **The score varies from run to run.** The model is not deterministic, which is why the saved fallback exists. In this round the expected label was 29, 30 and 31 of 32, and the wrong cases were different each time. Earlier rounds were weaker (table below), so a run can be clearly worse than the saved one. The saved file is the best of three runs, picked because it met the bar for saving. It is a real run but not typical.
- **C02 depends on the run.** It is `verified` here because a second person confirms it, and `unverified` when only the leaver's message is cited. Both are correct under the leaver-only rule, and the answer key was not changed.
- **C18 is not reliably `verified` in other runs (run 2 of the earlier round had it `unverified`).
- **The `missing` count is high** (18, against 13 in the earlier best run). Nine have a question, the others are gaps without one.
- **Rule 10 removes names it can match.** It matches display names, file names, locators and loose forms made of the words of a restricted title. A phrase that matches none of these ("HR and Lead Private Notes" matches only if it contains enough of the title words) can pass. A statement that cites an open source and uses its own wording is not changed. The saved file has one: the open task row T15 is titled "Lead-only HR notes verified", and the statement that quotes it says so.
- **Three conflict patterns are written into the code.** Any other kind of conflict is found only if the model finds it.
- **The routine-commit word list is a guess** and was not tuned on other projects. A real choice could be dropped if its message contains one of the words.
- **Only three real runs per round.** The figures are not averages.
- **"Verified" means the quoted words support the statement, not that the statement is the whole truth.** A true statement can be one side of a conflict that was reported separately.
- **A statement built from the restricted HR notes can be `verified`.** It is shown only to the lead, because it inherits the restriction of its source.
- The free tier of the AI service sometimes answers "high demand" (503). That is why a second model and saved results exist.

### Earlier round: runs after the rule 9 change (3 Nov 2026)

Run 3 of that round was the saved file until the round above.

| Run | Statements | Questions | Cited (of 32) | Expected label (of 32) | Conflicts (of 3) | Leaver-only `unverified` (of 4) | `missing` | Conflict duplicates | C18 | C07 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 108 | 9 | 31 | 27 | 3 | 4 | 16 | none | a `verified` and a `missing` statement | `unverified` |
| 2 | 108 | 9 | 32 | 30 | 3 | 4 | 16 | none | `unverified` | `unverified` |
| 3 (the saved file until the next round) | 114 | 9 | 32 | 31 | 3 | 4 | 18 | none | `verified` (and an `unverified` one) | `unverified` |
| The saved file before that, for comparison | 104 | 9 | 32 | 31 | 3 | 4 | 18 | none | `unverified` | `unverified` |

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
| | | 2 | 104 | 9 | 32 | 31 | 3 | 4 of 4 |
| | 3 | 108 | 9 | 32 | 30 | 3 | 4 of 4 |
| Rule 9 (leaver and tasks) | 1 | 108 | 9 | 31 | 27 | 3 | 4 of 4 |
| | 2 | 108 | 9 | 32 | 30 | 3 | 4 of 4 |
| | 3 | 114 | 9 | 32 | 31 | 3 | 4 of 4 |
| Restricted-location rule (rule 10) | 1 | 88 | 9 | 30 | 29 | 3 | 3 of 4 |
| | 2 | 93 | 9 | 32 | 30 | 3 | 4 of 4 |
| | **3 (saved)** | **106** | **9** | **32** | **31** | **3** | **4 of 4** |

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
| Departing member: answer, Next, reload | Pass at the time. The question showed as answered after a reload. Since merging the departing-member work, the server returns the saved `answer` text, so the screen shows it again; this was not hand-run again after the merge |
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

One backend finding, now fixed: for a handover that includes a lead-only document, a `missing` gap with no source of its own was shown to the incoming member. In an earlier saved file one such statement read "The contents of 'hr_private_notes paragraph 2' are not provided in the sources" (`GET /handovers/1/handover-view` as the incoming member, statement 37). It leaked the name of a restricted location, not its content.

The fix is in the access layer (`backend/app/access.py`), not in the prompt. A statement with no source of its own cannot be proven safe, so for the incoming member a `missing` gap with no source is shown as "Something is not documented here" with no sources, any other statement with no source is left out, and the real text stays with the lead. A question with no evidence is shown only to the lead, so the departing member does not get it in the list and cannot answer it. `tests/test_privacy.py` builds the leak (gaps and a claim that name `hr_private_notes`, `lead_private_chat` and a salary) and checks that none of those words appear in the incoming member's view or receipt, that the lead's preview equals the incoming view, that the lead still sees the original text, questions and version history, that the departing member gets no restricted question and `403` on the draft and the view, and that an outsider gets `403`. Five of these tests failed before the fix. The saved file needed no change: it has 114 statements and none without a source. One saved gap is titled "Confidential HR notes document..."; its source is the lead-only HR document, so the incoming member never receives it. Limit: a statement that cites an open source is judged by its sources, so text a model wrote about a restricted place while citing an open source is not caught by this rule.

A second defence was added in the pipeline (rule 10, `rules.py`): restricted source names are removed or neutralised in every statement and question the pipeline writes, so the text does not name a restricted place even before the access layer looks at it. The new saved file has no statement without a source and no restricted file name, path, paragraph number or title in any statement or question.

## Not tested yet

- **The AI in the automated tests.** The test suite never calls a real model. The real AI was run by hand on the synthetic project (above).
- **A deployed instance.** `render.yaml` is written but nothing is deployed to Render yet.
- **The frontend, beyond one local run.** The by-hand browser run is described above. The frontend has no automated tests, was not run in AI mode, only in one browser (the Claude desktop app's built-in one) and one window size, and not with voice answers.
- **The frontend Docker image.** Only the backend and Postgres were built and run in Docker.
- **Load and long inputs.** A very large repository would need chunking, which is not built.
- **Outside users.** No structured feedback has been collected yet. The script and a table to fill in are in [`FEEDBACK.md`](FEEDBACK.md).
