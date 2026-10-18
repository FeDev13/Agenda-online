# Honorarios

`/app/honorarios` records a manually entered total expected fee per case and currency
(ARS and USD). This is an estimate, not an invoice, receipt, collected income, or
remaining balance. No exchange rates or automatic legal fee calculations apply.
Zero is an explicit estimate; absent rows mean no estimate has been recorded.
Totals include visible open cases only; closed and archived cases remain readable.

The single new `case_fee_estimates` table reuses existing cases, membership,
assignment and audit tables. Exact integer cents avoid floating point arithmetic
when accepting amounts. Each estimate is capped at 9,999,999,999.99 per currency.
Admins and lawyers can update open cases; assigned paralegals and read-only members
can read. Inactive members and users from other firms cannot access estimates.
RLS protects reads; writes use an authorized RPC with an atomic audit insert and
an optimistic revision check. Case-row locking serializes creation and archival.
No financial amounts are copied into audit metadata.

Apply `supabase/migrations/202610180001_case_fee_estimates.sql` before deploying
application code. Run `pnpm test:db` against a migrated local database. This does
not require new environment variables or storage buckets. Database backups include
estimates; existing database restore procedures apply. Ordinary removal uses case
archival. The existing approved administrator-only permanent case deletion also
removes estimates through their case foreign key; audit entries remain.

For rollback, revert the application first and retain the table and audit records.
Prefer a forward migration for schema corrections; do not drop financial data to
roll back a release. The migration was applied to the linked hosted database during
the Honorarios release, before pushing application code.
