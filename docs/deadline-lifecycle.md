# Legal deadline lifecycle

The firm confirmed this workflow on 2026-10-16. No legal deadline is calculated automatically.

## States and human decisions

- **Pending (`pending`):** a person has confirmed an outstanding obligation. Past dates appear in **Vencidos**; current/future dates appear in **Próximos ítems**.
- **Needs review (`needs_review`):** the upgrade found an existing past deadline whose outcome is unknown. It appears in **Por revisar**, not in the confirmed overdue count. A schedule manager must confirm pending, completed, or cancelled.
- **Completed (`completed`):** a person confirms the obligation was fulfilled.
- **Cancelled (`cancelled`):** a person confirms the obligation no longer applies.

Completed and cancelled deadlines remain in **Resueltos**, preserve their original dates, and may be reopened to pending. They must be reopened before changing to another resolved state. No deadline is hard-deleted by this workflow. The previous/next state, revision, actor, firm, target, and timestamp are recorded in the append-only audit trail without titles, sources, or other case content.

New manually entered deadlines require an explicit date, source, and confirmation checkbox. The database retains the existing creator and date-confirmation actor. The latest status actor and timestamp are separate fields.

## Visibility and authorization

Admins and lawyers can manage firm-visible deadlines. Paralegals additionally need case assignment. Read-only users can inspect assigned deadlines but cannot change their state. Inactive and cross-firm access are denied. The mutation RPC performs these checks inside PostgreSQL; the application rechecks the role before invoking it.

Only the RPC may write lifecycle columns for authenticated callers. Existing column grants still permit the authorized creation and hide RPCs. A locked row and expected revision prevent silently overwriting another person's decision. A stale form receives a reload-and-review message.

Hiding is not resolution. Upcoming views retain the existing hide preference. An overdue pending deadline or a deadline requiring review remains visible in its action queue even if previously hidden.

## Agenda and alerts

The database filters the complete authorized timeline before sorting and pagination. Pages contain 25 entries across all types, with stable ordering by firm-local date, event instant, kind, and ID. Date/type filters and the current lifecycle view persist across page links. Firm-configured timezones determine today's date and event date grouping; date-only values are never timezone-shifted.

Resolved deadlines leave future alert selection. The email job also rechecks current status immediately before calling the email provider and marks an already resolved candidate skipped. An email already handed to the provider cannot be recalled. Existing per-recipient/item/window idempotency remains: reopening does not deliberately resend an already delivered alert for the same window.

## Migration and release

`supabase/migrations/202610160001_deadline_lifecycle.sql` is additive and does not reset the database. Existing deadlines earlier than the firm's current local date become `needs_review`, including hidden deadlines. Each receives a system audit entry. Existing future deadlines retain pending behavior.

The migration was validated locally and subsequently applied to the linked hosted database after the application deployment exposed a missing-migration failure. Both `/app` and `/app/calendar` require `list_agenda`; pushing application code alone does not apply database migrations.

For a hosted release:

1. Take the normal database backup and verify the restore procedure. This migration changes no stored document contents or bucket policies; keep document backups under the separate existing procedure.
2. Pause deadline email scheduling during the application/migration switch.
3. Apply the checked-in migration using the approved deployment process, run `pnpm db:check:linked`, then deploy this application version. This read-only preflight exits unsuccessfully if any local migration is missing remotely or the histories diverge.
4. Run role/cross-firm smoke checks with synthetic accounts; inspect the review queue and confirm pending/resolved behavior.
5. Resume the job using the new status-aware code. Have authorized firm staff review historical deadlines without bulk-assuming their outcome.

Prefer a forward fix. Do not drop lifecycle columns or erase audit entries after people have made decisions. An older application version does not understand resolved states and must not run its previous alert job against this schema. Restoring a backup after new decisions requires an explicit recovery plan so those decisions are not silently lost.

## Verification

- Database tests include all four roles, assignment restrictions, inactive membership, cross-firm denial, column-write denial, actor/audit persistence, stale revisions, historical review, hidden-overdue behavior, and pagination beyond the former 20-entry limit.
- Unit tests cover date/source/confirmation validation, allowed client states, revision boundaries, retained query filters, and email selection/send-time rechecks.
- Browser tests exercise manual creation, required confirmation, completion, cancellation of a confirmation dialog, reopening, and read-only denial.
