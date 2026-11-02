# Campus Events App - Deployment Guide

Synthetic operational setup guide for university hosting environments.

## Hosting Platform
The API and frontend are hosted on Render under the free tier. Render was selected over alternatives because it provides native continuous deployment directly linked to our GitHub repository.

## Environment Variables
The application requires the following environment variables:
- `ENVIRONMENT`: staging or production
- `DATABASE_URL`: sqlite:///./campus_events.db
- `JWT_SECRET_KEY`: 32-byte secret for session cookie encryption
- `SMTP_HOST`: mail.campus-synthetic.internal
- `SMTP_PORT`: 587
- `SMTP_USER`: events-notify@campus-synthetic.internal

Note: Ensure database files are mounted to a persistent volume or state will be lost on container restart.

## Key Operational Contacts
- For DNS records, SSL certificates, and Render environment variables, ask Ravi (ravi@campus-synthetic.internal) directly.
- For production database restore access and escalated permissions, contact Deepak (deepak-lead@campus-synthetic.internal).
- For student union club approvals, reach out to council-lead@campus-synthetic.internal.
