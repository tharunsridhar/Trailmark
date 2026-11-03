# Trailmark API

Backend: FastAPI. Local base URL `http://localhost:8000`. Interactive docs for the live endpoints are at `/docs`.

Every endpoint listed here is built and covered by the automated tests. Round 3 only (not built): follow-up questions, decision timeline, audit log.

## Rules for every request

- Send the login cookie: `fetch(url, { credentials: "include" })`.
- `401` not signed in. `403` signed in, but not a member of that handover or the wrong role. `404` not found. `409` conflict, such as a duplicate. `422` the request body is invalid.
- Roles are `lead`, `departing`, `incoming`. A role belongs to a user inside one handover, not to the account.
- Timestamps are ISO 8601 in UTC.
- Evidence labels: `verified`, `unverified`, `missing`, `conflicting`.
- Statement kinds: `decision`, `owner`, `unfinished`, `dependency`, `blocker`, `risk`, `recurring`, `contact`, `next_action`, `answer`.
- Once a handover is approved it is read-only: edits, answers, uploads and new analyses return `409`.
- Statement status: `draft`, `approved`, `rejected`, `accepted_gap`, `answered` (a gap the departing member has answered, the answer is its own statement).

## Summary

| Method | Path | Who | Status |
| --- | --- | --- | --- |
| GET | `/health` | anyone | live |
| POST | `/auth/register` | anyone | live |
| POST | `/auth/login` | anyone | live |
| POST | `/auth/logout` | anyone | live |
| GET | `/auth/me` | signed in | live |
| POST | `/handovers` | signed in | live |
| GET | `/handovers` | signed in | live |
| GET | `/handovers/{id}` | member | live |
| GET | `/handovers/{id}/members` | lead | live |
| POST | `/handovers/{id}/members` | lead | live |
| POST | `/handovers/{id}/sources` | lead | live |
| GET | `/handovers/{id}/sources` | lead | live |
| GET | `/pieces/{piece_id}` | member allowed to see it | live |
| POST | `/handovers/{id}/analyze` | lead | live |
| GET | `/handovers/{id}/analysis` | lead | live |
| GET | `/handovers/{id}/statements` | lead | live |
| GET | `/statements/{id}` | lead | live |
| PATCH | `/statements/{id}` | lead | live |
| POST | `/statements/{id}/reject` | lead | live |
| POST | `/statements/{id}/resolve` | lead | live |
| POST | `/statements/{id}/accept-gap` | lead | live |
| GET | `/statements/{id}/versions` | lead | live |
| GET | `/handovers/{id}/questions` | lead, departing | live |
| POST | `/questions/{id}/answer` | departing | live |
| POST | `/handovers/{id}/approve` | lead | live |
| GET | `/handovers/{id}/handover-view` | incoming (lead can preview) | live |
| POST | `/handovers/{id}/receipt` | incoming | live |
| GET | `/handovers/{id}/receipt` | lead, incoming | live |

`GET /health` returns `{"status": "ok"}` and needs no sign-in.

---

## Auth (live)

### POST /auth/register

Creates the account and signs the user in (sets the cookie).

```json
{ "email": "asha@example.com", "name": "Asha", "password": "at-least-8-chars" }
```

`201`

```json
{ "id": 1, "email": "asha@example.com", "name": "Asha" }
```

`409` if the email is taken. `422` if the password is shorter than 8 characters.

### POST /auth/login

```json
{ "email": "asha@example.com", "password": "at-least-8-chars" }
```

`200` returns the same user object and sets the cookie. `401` for a wrong email or password (same message for both).

### POST /auth/logout

`200` `{ "ok": true }`. Clears the cookie.

### GET /auth/me

`200` the user object, `401` if not signed in. Call this on page load to know whether someone is signed in.

---

## Handovers (live)

### POST /handovers

The creator becomes the lead.

```json
{ "title": "Asha is leaving", "project_name": "Campus Events App" }
```

`201`

```json
{
  "id": 3,
  "title": "Asha is leaving",
  "project_name": "Campus Events App",
  "status": "draft",
  "created_at": "2026-11-02T09:30:00Z",
  "approved_at": null,
  "my_role": "lead"
}
```

### GET /handovers

Handovers the signed-in user belongs to, newest first. Same object as above, `my_role` is the user's role in each. Use it to decide which screen to open.

### GET /handovers/{id}

One handover, same object. `403` for non-members.

### GET /handovers/{id}/members (lead)

```json
[
  { "user_id": 1, "name": "Kishan", "email": "kishan@example.com", "role": "lead" },
  { "user_id": 2, "name": "Asha", "email": "asha@example.com", "role": "departing" }
]
```

### POST /handovers/{id}/members (lead)

The person must already have registered.

```json
{ "email": "ravi@example.com", "role": "incoming" }
```

`201` returns the member object. `404` no such user, `409` already in the handover, `422` bad role.

---

## Sources (live)

### POST /handovers/{id}/sources (lead)

Multipart form upload. Fields: `type` (`repo`, `doc`, `chat`, `tasks`), `name`, `allowed_roles` (JSON list as a string, for example `["lead","departing"]`), `file`. File formats are described in `data/README.md`.

`201`

```json
{
  "id": 5,
  "type": "chat",
  "name": "Team chat",
  "allowed_roles": ["lead", "departing", "incoming"],
  "status": "ok",
  "note": null,
  "piece_count": 84
}
```

`status` is `ok`, `empty` or `unreadable`. For the last two the response has a `note` explaining why, show it. Nothing is guessed from an empty or unreadable file. A bad `type` or `allowed_roles` is `422`, a file over 5 MB is `413`, and uploading after approval is `409`.

### GET /handovers/{id}/sources (lead)

List of the objects above.

### GET /pieces/{piece_id}

One source piece, for opening a citation. `403` if the caller's role may not see its source.

```json
{
  "id": 41,
  "source_id": 5,
  "source_name": "Team chat",
  "locator": "chat message 14",
  "content": "Asha: let's go with Render, the free tier is enough for now"
}
```

---

## Analysis (live)

### POST /handovers/{id}/analyze (lead)

Runs reconstruct, verify and gap detection. Returns right away, the work runs in the background. Running it again replaces the earlier draft.

`202` `{ "status": "running", ... }`

`409` if there is no readable source yet, an analysis is already running, or the handover is approved.

### GET /handovers/{id}/analysis (lead)

Poll this until `status` is `done` (`running`, `done`, `failed`, or `not_started` before the first run). `dropped` counts claims thrown away because their quote was not in the cited source.

```json
{
  "status": "done",
  "mode": "ai",
  "notice": null,
  "counts": { "verified": 12, "unverified": 3, "missing": 4, "conflicting": 2 },
  "dropped": 1,
  "started_at": "2026-11-02T10:00:00Z",
  "finished_at": "2026-11-02T10:00:40Z"
}
```

`mode` is `ai`, `saved` (using saved results) or `basic` (no AI). When it is not `ai`, show `notice`, for example "AI unavailable: showing saved results".

---

## Questions

### GET /handovers/{id}/questions (lead, departing)

Highest risk first, at most nine in total per handover (gaps beyond that stay as gaps without a question). `evidence` lists the source pieces that raised the question, with the quoted words. A question is left out completely for a viewer who may not see all of its evidence, or when it has no evidence at all (its wording cannot be proven safe), so the departing member never gets restricted text through a question. The lead sees every question.

```json
[
  {
    "id": 9,
    "text": "Commit a3f9c21 rewrote the payment retry logic but no reason is recorded. Why was it changed?",
    "risk": 3,
    "status": "open",
    "evidence": [{ "piece_id": 12, "locator": "commit a3f9c21", "quote": "rewrite payment retry" }]
  }
]
```

`status` is `open`, `answered`, `skipped` or `unknown`.

### POST /questions/{id}/answer (departing)

```json
{ "action": "answer", "text": "Retries kept timing out on the free tier, so I added backoff." }
```

`action` is `answer`, `skip` or `unknown`. `text` is required only for `answer` (`422` otherwise).

- An answer becomes a statement of kind `answer`, label `unverified`, linked to the same evidence that raised the question. The gap statement it covers changes to status `answered`.
- `skip` and `unknown` leave the gap open, it stays visible in the handover.
- `403` for anyone but the departing member, and for a question built from evidence the departing member may not see. `409` if already answered or the handover is approved.

`200` returns the updated question.

---

## Review (lead only)

A statement looks like this everywhere:

```json
{
  "id": 21,
  "kind": "decision",
  "text": "The team chose Render for hosting because the free tier is enough.",
  "label": "verified",
  "status": "draft",
  "current_version": 1,
  "sources": [
    {
      "piece_id": 41,
      "locator": "chat message 14",
      "source_name": "Team chat",
      "quote": "let's go with Render, the free tier is enough for now",
      "chosen": null
    }
  ]
}
```

### GET /handovers/{id}/statements

Query filters: `kind`, `label`, `status`. Returns a list of statements.

### GET /statements/{id}

One statement.

### PATCH /statements/{id}

```json
{ "text": "Corrected wording", "reason": "Asha confirmed the date" }
```

Saves a new version with the editor's name. `409` for a rejected statement.

### POST /statements/{id}/reject

```json
{ "reason": "Not supported by the sources" }
```

### POST /statements/{id}/resolve

For `conflicting` statements. Pick one source, a written reason is required. The other source stays in the history, marked `chosen: false`. The statement becomes `verified`. `text` is optional new wording that matches the chosen source. `422` if `chosen_piece_id` is not one of the statement's sources, `409` if it is not an open conflict.

```json
{ "chosen_piece_id": 41, "reason": "The chat is newer than the design doc", "text": "Hosting is on Render" }
```

### POST /statements/{id}/accept-gap

For `missing` statements the lead decides to leave as a known unknown. The statement gets status `accepted_gap` and is still shown to the incoming member as an open question. `409` if it is not an open gap.

```json
{ "reason": "Nobody knows, will be found out while working" }
```

### GET /statements/{id}/versions

```json
[
  { "version": 2, "action": "edited", "text": "Corrected wording", "label": "verified", "editor": "Kishan", "reason": "Asha confirmed the date", "created_at": "2026-11-02T11:00:00Z" },
  { "version": 1, "action": "created", "text": "Original wording", "label": "verified", "editor": null, "reason": null, "created_at": "2026-11-02T10:00:00Z" }
]
```

### POST /handovers/{id}/approve

Marks the handover `approved` and every statement still in `draft` as `approved`. Rejected statements and answered gaps are not shared. Nothing reaches the incoming member before this. `409` if no analysis has run, if open conflicts are unresolved (resolve or reject them), or if already approved.

`200` returns the handover object.

---

## Incoming member

### GET /handovers/{id}/handover-view

Only available once the handover is approved (`409` before that). Always filtered as the incoming member: a statement is left out completely unless the incoming role may see every source behind it. A `missing` gap that has no source of its own is returned with the text `Something is not documented here` and an empty `sources` list, because its real text could name a restricted place. Any other statement with no source is left out. The lead can call it to preview exactly what the incoming member will get. The departing member gets `403`.

Text and quotes are **redacted** for this view: emails become `[redacted email]`, phone numbers `[redacted phone]`, API keys `[redacted secret]` and passwords `password is [redacted]`. This is pattern based, treat it as a safety net. In a resolved conflict only the chosen source is listed.

```json
{
  "handover": { "id": 3, "title": "Asha is leaving", "project_name": "Campus Events App", "approved_at": "2026-11-02T14:00:00Z" },
  "decisions": [ { "id": 21, "kind": "decision", "text": "...", "label": "verified", "status": "approved", "current_version": 2, "sources": [] } ],
  "owns": [],
  "unfinished": [],
  "risks": [],
  "dependencies": [],
  "contacts": [],
  "from_departing_member": [],
  "open_questions": [ { "id": 33, "kind": "owner", "text": "Task T2 has no owner", "label": "missing", "status": "accepted_gap", "current_version": 2, "sources": [] } ],
  "next_actions": [ { "order": 1, "text": "Finish the login pull request", "statement_id": 34, "label": "verified", "sources": [] } ],
  "receipt": null
}
```

- Each list holds statement objects (see Review). `risks` also holds `recurring` and `blocker` statements.
- `from_departing_member` holds the leaver's answers, always labelled `unverified`. Show that.
- `open_questions` holds gaps (`label: missing`) that nobody answered. `status` is `approved` or `accepted_gap`.
- `next_actions` is in the recommended order. It is a suggestion for the lead and the incoming member to review, say so on screen.
- `receipt` is filled in once the caller has confirmed receipt.

### POST /handovers/{id}/receipt (incoming)

`201`

```json
{ "handover_id": 3, "user_id": 4, "user_name": "Ravi", "created_at": "2026-11-02T15:00:00Z" }
```

`409` if already confirmed or not approved yet. `403` for anyone but the incoming member.

### GET /handovers/{id}/receipt (lead, incoming)

`200` the receipt object, or `404` if not confirmed yet. The lead gets the first confirmed receipt, to see whether the handover was received. The departing member gets `403`.
