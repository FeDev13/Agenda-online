# Deadline Email Alerts

Agenda sends upcoming deadline emails through Resend from a protected server route.
PostgreSQL remains the source of truth for deadlines, task due dates, recipients, and
delivery idempotency.

## Flow

1. A scheduler calls `POST /api/cron/deadline-alerts` with
   `Authorization: Bearer $DEADLINE_ALERT_CRON_SECRET`.
2. The route uses the server-only Supabase service role key to read active firms,
   upcoming legal deadlines, open task due dates, memberships, and case assignments.
3. The job considers date-only windows in each firm's timezone:
   - `seven_day`
   - `forty_eight_hour`
   - `twenty_four_hour`
4. Recipients are active users who can access the case:
   - admins and lawyers by firm-wide role
   - paralegals and read-only users only when explicitly assigned to the case
5. Before sending, the job creates or reuses a `notification_deliveries` row keyed by
   recipient, item, channel, and alert window.
6. Resend receives an idempotency key for the same recipient/item/window. Successful and
   failed attempts are recorded in `notification_deliveries`.

## Confidentiality

Email content must not include client names, case titles, note bodies, document names,
deadline rule notes, or other matter details. The current template includes only the due
date, alert window, and a sign-in link to `/app/calendar`.

## Required Environment

All variables are server-only except the existing public Supabase variables.

- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO_EMAIL`
- `DEADLINE_ALERT_CRON_SECRET`

Before production, verify the sending domain in Resend and configure SPF, DKIM, and DMARC
for that domain.

## Scheduling

Run the endpoint daily in the firm's operating morning, or hourly if multiple firms may
use different timezones. Repeated runs are safe because delivery rows and Resend
idempotency keys prevent duplicate sends for the same alert window.

Use dry run mode to inspect candidate counts without creating delivery records or sending
email:

```text
POST /api/cron/deadline-alerts?dryRun=1
Authorization: Bearer $DEADLINE_ALERT_CRON_SECRET
```

## Future Work

- Add a UI for email alert preferences per user or firm.
- Add Resend webhook handling for bounces, complaints, and delivery confirmations.
- Add an admin delivery-status view that avoids exposing unnecessary recipient data.
