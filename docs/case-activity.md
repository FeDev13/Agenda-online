# Recent case activity

The dashboard shows the five open cases with the latest activity. The open-case list uses the same order, preserving it when filtering. Opening dates do not determine recency; reading a case does not change its position. Equal activity timestamps use the case UUID as a stable tie-breaker.

Migration `202610200001_case_activity.sql` adds `cases.last_activity_at`, backfills it from existing case edits and related tasks, legal deadlines, events, notes, documents, and fee estimates, and maintains it transactionally with triggers. Insertions and updates to those related rows count as activity, including task/deadline status changes. Child activity only touches open cases; archived cases retain their archive timestamps. Existing row authorization and audit operations remain in place. Trigger helpers have no callable grants for browser roles.

Apply the migration before deploying the application change. No hosted migration is applied by a Git push. Verify linked migration parity using `pnpm db:check:linked` before release. Roll back the application first if needed; leaving the additive column and triggers in place is safe. Prefer a subsequent migration for any database forward fix.

Validation: `pnpm test:db` covers case edits, assigned-paralegal task creation, deadline creation, and unchanged timestamps after denied reader/cross-firm writes. The browser activity workflow verifies both lists after case creation, task creation, and deadline creation using isolated synthetic data.
