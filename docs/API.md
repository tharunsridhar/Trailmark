# Trailmark API

Backend: FastAPI. Local base URL `http://localhost:8000`. Interactive docs for the live endpoints are at `/docs`.

Status column: **live** means it works now, **P2** and **P3** mean it arrives in Phase 2 or Phase 3 of the Round 2 build. Planned endpoints already have their final shape, so build against the sample JSON.

## Rules for every request

- Send the login cookie: `fetch(url, { credentials: "include" })`.
- `401` not signed in. `403` signed in, but not a member of that handover or the wrong role. `404` not found. `409` conflict, such as a duplicate. `422` the request body is invalid.
- Roles are `lead`, `departing`, `incoming`. A role belongs to a user inside one handover, not to the account.
- Timestamps are ISO 8601 in UTC.
- Evidence labels: `verified`, `unverified`, `missing`, `conflicting`.
- Statement kinds: `decision`, `owner`, `unfinished`, `dependency`, `blocker`, `risk`, `recurring`, `contact`, `next_action`, `answer`.
- Statement status: `draft`, `approved`, `rejected`, `accepted_gap`.

## Summary

| Method | Path | Who | Status |
| --- | --- | --- | --- |
| POST | `/auth/register` | anyone | live |
| POST | `/auth/login` | anyone | live |
| POST | `/auth/logout` | anyone | live |
| GET | `/auth/me` | signed in | live |
| POST | `/handovers` | signed in | live |
| GET | `/handovers` | signed in | live |
| GET | `/handovers/{id}` | member | live |
| GET | `/handovers/{id}/members` | lead | live |
| POST | `/handovers/{id}/members` | lead | live |
| POST | `/handovers/{id}/sources` | lead | P2 |
| GET | `/handovers/{id}/sources` | lead | P2 |
| GET | `/pieces/{piece_id}` | member allowed to see it | P2 |
| POST | `/handovers/{id}/analyze` | lead | P2 |
| GET | `/handovers/{id}/analysis` | lead | P2 |
| GET | `/handovers/{id}/statements` | lead | P3 |
| GET | `/statements/{id}` | lead | P3 |
| PATCH | `/statements/{id}` | lead | P3 |
| POST | `/statements/{id}/reject` | lead | P3 |
| POST | `/statements/{id}/resolve` | lead | P3 |
| POST | `/statements/{id}/accept-gap` | lead | P3 |
| GET | `/statements/{id}/versions` | lead | P3 |
| GET | `/handovers/{id}/questions` | lead, departing | P2 |
| POST | `/questions/{id}/answer` | departing | P3 |
| POST | `/handovers/{id}/approve` | lead | P3 |
| GET | `/handovers/{id}/handover-view` | incoming (lead can preview) | P3 |
| POST | `/handovers/{id}/receipt` | incoming | P3 |
| GET | `/handovers/{id}/receipt` | lead, incoming | P3 |

Round 3 only, not built now: follow-up questions, decision timeline, audit log.

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

## Sources (P2)

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
  "piece_count": 84
}
```

`status` is `ok`, `empty` or `unreadable`. Show a clear message for the last two, nothing is guessed from them.

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

## Analysis (P2)

### POST /handovers/{id}/analyze (lead)

Runs reconstruct, verify and gap detection. Returns right away, the work runs in the background.

`202` `{ "status": "running" }`

### GET /handovers/{id}/analysis (lead)

Poll this until `status` is `done` (`running`, `done`, `failed`).

```json
{
  "status": "done",
  "mode": "ai",
  "notice": null,
  "counts": { "verified": 12, "unverified": 3, "missing": 4, "conflicting": 2 }
}
```

`mode` is `ai`, `saved` (using saved results) or `basic` (no AI). When it is not `ai`, show `notice`, for example "AI unavailable: showing saved results".

---

## Questions (P2 list, P3 answer)

### GET /handovers/{id}/questions (lead, departing)

Highest risk first. `evidence` is the text that raised the question, `pieces` are the citations behind it (only ones the caller may see).

```json
[
  {
    "id": 9,
    "text": "Commit a3f9c21 rewrote the payment retry logic but no reason is recorded. Why was it changed?",
    "evidence": "commit a3f9c21: rewrite payment retry",
    "risk": 3,
    "status": "open",
    "pieces": [{ "id": 12, "locator": "commit a3f9c21" }]
  }
]
```

`status` is `open`, `answered`, `skipped` or `unknown`.

### POST /questions/{id}/answer (departing)

```json
{ "action": "answer", "text": "Retries kept timing out on the free tier, so I added backoff." }
```

`action` is `answer`, `skip` or `unknown`. `text` is required only for `answer`. An answer becomes an `unverified` statement. Skipped and unknown questions stay visible as open gaps.

`200` returns the updated question.

---

## Review (P3, lead only)

A statement looks like this everywhere:

```json
{
  "id": 21,
  "kind": "decision",
  "text": "The team chose Render for hosting because the free tier is enough.",
  "label": "verified",
  "status": "draft",
  "quote": "let's go with Render, the free tier is enough for now",
  "current_version": 1,
  "sources": [
    { "piece_id": 41, "locator": "chat message 14", "source_name": "Team chat", "chosen": null }
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

Saves a new version with the editor's name.

### POST /statements/{id}/reject

```json
{ "reason": "Not supported by the sources" }
```

### POST /statements/{id}/resolve

For `conflicting` statements. Pick one source, a written reason is required. The other source stays in the history, marked as not chosen.

```json
{ "chosen_piece_id": 41, "reason": "The chat is newer than the design doc" }
```

### POST /statements/{id}/accept-gap

For `missing` statements the lead decides to leave as a known unknown.

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

Marks the handover `approved` and the reviewed statements `approved`. Nothing reaches the incoming member before this. `409` if open conflicts are still unresolved.

`200` returns the handover object.

---

## Incoming member (P3)

### GET /handovers/{id}/handover-view

Only available once the handover is approved (`409` before that). Statements the caller may not fully see are left out, nothing is returned for them. The lead can call it to preview what the incoming member will get.

```json
{
  "handover": { "id": 3, "title": "Asha is leaving", "project_name": "Campus Events App", "approved_at": "2026-11-02T14:00:00Z" },
  "owns": [ { "id": 30, "kind": "owner", "text": "...", "label": "verified", "sources": [] } ],
  "unfinished": [],
  "risks": [],
  "dependencies": [],
  "contacts": [],
  "open_questions": [ { "id": 33, "text": "...", "label": "missing", "status": "accepted_gap" } ],
  "next_actions": [ { "order": 1, "text": "Finish the login pull request", "statement_id": 34 } ],
  "receipt": null
}
```

Every statement uses the statement object above (`sources` filtered to what the caller can see). `next_actions` is a recommendation, say so on screen.

### POST /handovers/{id}/receipt (incoming)

`201`

```json
{ "handover_id": 3, "user_id": 4, "created_at": "2026-11-02T15:00:00Z" }
```

`409` if already confirmed.

### GET /handovers/{id}/receipt (lead, incoming)

`200` the receipt object, or `404` if not confirmed yet. The lead uses it to see whether the handover was received.
