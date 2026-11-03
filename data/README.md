# Synthetic project

The invented project the whole pipeline is demonstrated and scored against, in `synthetic/`. The importers read the exact formats below. A copy is served by the frontend from `frontend/public/synthetic/`.

## Rules

1. Everything is fake: invented people, company, emails. Label it as synthetic.
2. It was made in the official build window.
3. It is meant to feel real: casual chat, half-finished notes, inconsistent naming.
4. It is small enough to check by hand. The target was about 5 people, 2 to 3 months of activity, 60 to 100 chat messages, 20 to 30 commits, 5 to 8 issues or PRs, 3 to 4 documents, 15 to 20 tasks.
5. One project, one leaver, one successor.
6. Every planted case is written in the answer key (32 cases).

## Layout

```
data/synthetic/
  manifest.json
  repo/export.json
  docs/architecture_overview.md
  docs/deployment_guide.md
  docs/hr_private_notes.md
  docs/meeting_notes_august.md
  chat/chat.json
  chat/lead_private_chat.json
  tasks/tasks.csv
  tasks/empty_tasks.csv
  answer_key.json
```

## Formats

**manifest.json** lists every source and who may see it. Roles are `lead`, `departing`, `incoming`.

```json
{
  "project_name": "Campus Events App",
  "people": [{ "name": "Asha", "role": "leaver" }],
  "sources": [
    { "file": "repo/export.json", "type": "repo", "name": "Code repository", "allowed_roles": ["lead", "departing", "incoming"] },
    { "file": "docs/hr_private_notes.md", "type": "doc", "name": "HR notes", "allowed_roles": ["lead"] }
  ]
}
```

`type` is one of `repo`, `doc`, `chat`, `tasks`.

**repo/export.json**

```json
{
  "commits": [{ "sha": "a3f9c21", "author": "Asha", "date": "2026-09-03T14:20:00", "message": "rewrite payment retry", "files": ["api/payments.py"] }],
  "pull_requests": [{ "number": 4, "title": "Add login", "author": "Asha", "state": "open", "body": "...", "comments": ["..."] }],
  "issues": [{ "number": 7, "title": "Deploy fails on Render", "author": "Ravi", "state": "open", "body": "...", "comments": ["..."] }]
}
```

**chat/chat.json**

```json
{ "messages": [{ "id": 1, "time": "2026-09-01T10:15:00", "sender": "Asha", "text": "..." }] }
```

**tasks/tasks.csv** has the header `id,title,owner,status,due,notes`. Leave `owner` empty on some rows on purpose. `tasks/empty_tasks.csv` has only the header, it tests the empty-source case.

**docs/*.md** are plain Markdown: design notes, meeting notes, setup notes.

## Cases to plant

| Case | How many | Expected label |
| --- | --- | --- |
| Decision with a reason, backed by a source | 4 to 5 | verified |
| Claim only the leaver makes, nothing backs it | 3 to 4 | unverified |
| Two sources contradict each other | 2 to 3 | conflicting |
| Missing information: unowned task, undocumented dependency | 3 to 4 | missing, and a question is generated |
| Unfinished work: half-done PR, stalled task | 3 to 4 | appears under unfinished work |
| Dependency between parts, an API key, another member's module | 2 to 3 | appears under dependencies |
| Recurring problem, the same bug mentioned several times | 1 to 2 | appears under risks |
| Key contact, "ask Ravi about the hosting account" | 2 to 3 | appears under contacts |
| Restricted item: fake password, salary, private HR chat | 2 to 3 | never visible to the incoming member |
| A normal message that quotes a restricted document | 1 | derived statement inherits the restriction |

The leaver (Asha) knows things that exist nowhere else, so the question step matters.

## answer_key.json

One entry per planted case.

```json
{
  "cases": [
    {
      "id": "C01",
      "type": "decision",
      "source_file": "chat/chat.json",
      "location": "message 14",
      "description": "Team chose Render over Heroku because of the free tier",
      "expected_label": "verified",
      "expected_visible_to": ["lead", "departing", "incoming"]
    }
  ]
}
```

`type` is one of `decision`, `unverified_claim`, `conflict`, `missing`, `unfinished`, `dependency`, `recurring`, `contact`, `restricted`, `derived_restricted`. `expected_label` is `verified`, `unverified`, `conflicting` or `missing`.
