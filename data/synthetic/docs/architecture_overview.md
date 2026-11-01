# Campus Events App - Architecture Overview

Synthetic Project Documentation for Trailmark Verification Pipeline.

## Core Database Decision
We chose SQLite with WAL mode over PostgreSQL for the initial campus MVP to avoid database hosting costs and simplify zero-configuration deployment during the student pilot. The WAL (Write-Ahead Logging) mode allows concurrent readers alongside a single active writer.

## Venue Capacity Limits
The maximum auditorium event capacity is hard-capped at 500 attendees due to campus fire safety regulations. The registration controller validates attendee counts against this limit before creating ticket records.

## Ticket Badge Verification
All ticket QR codes encode a signed HMAC-SHA256 JSON token containing the ticket ID and secret salt. Gate volunteers scan this cryptographic payload with the mobile scanner app to prevent ticket duplication.

## Background Processing
Event confirmation emails and PDF badge attachments are processed asynchronously. When an attendee confirms registration, the main API publishes an event message to the internal task queue rather than generating ReportLab PDFs synchronously inside the HTTP request.
