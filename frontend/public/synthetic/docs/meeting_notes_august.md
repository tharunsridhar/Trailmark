# Engineering Sync Notes - August 2026

Synthetic meeting archive. Attendees: Deepak (Lead), Asha, Ravi, Neha, Arun.

## Frontend UI Architecture Decision
The team agreed to adopt Tailwind CSS instead of Chakra UI for the frontend rebuild to reduce build bundle size and eliminate runtime emotion CSS overhead. Neha confirmed this dropped initial page load from 2.4s to 680ms on low-bandwidth mobile connections.

## Component Dependencies
- The ticket generation service in `services/tickets.py` relies strictly on Ravi's background PDF worker daemon (`deploy/worker_daemon.py`) running on the same Celery queue. If the worker is offline, registration succeeds but badges are delayed.
- Calendar synchronization with Google Calendar requires the service account key stored at `keys/service_account.json`. Do not commit this key to version control.
- Neha's frontend event listing component depends on the upcoming search endpoint `/api/v1/events/search` currently being authored by Asha.

## Known Risks & Action Items
- Ravi reported worker memory spikes during bulk PDF badge rendering when student orientation batches exceed 100 registrations.
- Database locking errors reported during high-traffic registration windows will be mitigated with SQLite connection pooling timeouts.
