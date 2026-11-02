# Frontend (Kishan)

This folder is yours. The backend (Tharun) is FastAPI and everything it exposes is listed in [`../docs/API.md`](../docs/API.md) with sample requests and responses, so you can build against saved JSON before the real endpoints are live.

## Stack

Next.js (React, TypeScript). Deploy on Vercel.

## Talking to the backend

- Base URL comes from `NEXT_PUBLIC_API_URL` (local default `http://localhost:8000`).
- Login sets an HTTP-only cookie. Every request must send it: `fetch(url, { credentials: "include" })`.
- `401` means not signed in, send the user to the login page.
- `403` means signed in but not allowed for that handover or action, show a "not allowed" message.
- Permissions are enforced by the backend. Never hide or show data only in the frontend and call that security. If the API does not return something, the user must not see it.

## Screens to build

| Screen | Who sees it | Endpoints |
| --- | --- | --- |
| Login and register | everyone | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| My handovers | everyone | `GET /handovers`, `POST /handovers` |
| Handover setup | lead | `GET /handovers/{id}`, `GET/POST /handovers/{id}/members`, `GET/POST /handovers/{id}/sources`, `POST /handovers/{id}/analyze`, `GET /handovers/{id}/analysis` |
| Departing member's questions | departing, lead | `GET /handovers/{id}/questions`, `POST /questions/{id}/answer`, `GET /pieces/{id}` (evidence) |
| Review and approval | lead | `GET /handovers/{id}/statements`, `GET /statements/{id}`, `PATCH /statements/{id}`, `POST /statements/{id}/reject`, `POST /statements/{id}/resolve`, `POST /statements/{id}/accept-gap`, `GET /statements/{id}/versions`, `POST /handovers/{id}/approve` |
| Incoming member's handover | incoming | `GET /handovers/{id}/handover-view`, `GET /pieces/{id}` (source link), `POST /handovers/{id}/receipt`, `GET /handovers/{id}/receipt` |

Every endpoint in the table is live. `docs/API.md` has the request and response for each one.

## Things the screens must do

- Show the evidence label on every statement: `verified`, `unverified`, `missing`, `conflicting`. Make them visually different.
- Every statement shows its source links. Clicking one opens the source piece (`GET /pieces/{id}`) with its quote highlighted.
- Conflicts show both sources side by side. Resolving needs a written reason before the button works.
- The lead's screen shows version history per statement.
- The incoming member's screen has a "Confirm receipt" button and shows open gaps clearly, not hidden.
- Empty or failed states need real messages: empty source, no answers yet, nothing approved yet.
- Keep it simple. The judges care that the central flow works, not how pretty it is.

## Not in this round

Follow-up questions, the decision timeline and the audit log are the Round 3 improvements. Do not build them now.

## Docker

The root `docker-compose.yml` has a `frontend` service that builds `./frontend` and serves it on port 3000. It only starts with `docker compose --profile frontend up --build`, so add a `Dockerfile` here when you are ready (run `npm run build` and `npm start`).

## Integration checklist (what is still missing)

`src/services/api.ts` already matches `docs/API.md`. The screens are not using it for their data yet:

1. `HandoverContext.tsx` builds everything from the hard-coded `SYNTHETIC_PROJECT`. Replace it with data from the backend.
2. Lead screen: upload the files in `data/synthetic/` with `uploadSource`, using the type and allowed roles listed in `data/synthetic/manifest.json`. Then call `triggerAnalysis` and poll `getAnalysis` until `status` is `done`. Show `notice` when `mode` is `saved` or `basic`.
3. Departing member screen: build the questions from `listQuestions` and send answers with `answerQuestion` using the real question ids.
4. Lead review screen: build the list from `listStatements`. Edit, reject, resolve, accept-gap and approve act on the real statement ids.
5. Incoming member screen: build it from `getHandoverView`, which only works after approval (`409` before). Confirm with `confirmReceipt`.
6. Remove the silent `.catch(() => {})` on API calls and show an error message instead. A `401` means the user is not signed in, a `403` means the wrong role.
7. Sign in as three different users (lead, departing, incoming) added to the same handover with `addMember`, so each role sees its own filtered view.
