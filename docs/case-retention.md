# Case Retention and Permanent Deletion

Cases are archived by default, not hard-deleted. Archival hides a case from open-case
workflows while preserving the row, assignments, case work, document metadata, and audit
history.

Permanent deletion is limited to administrator cleanup of synthetic or development data.
It is not an approved retention workflow for real firm data.

## Permanent Deletion Rule

An administrator may permanently delete a case only when all of the following are true:

- The case is already archived.
- The administrator confirms the exact case number in the UI.
- The deletion is for synthetic or development data, or a separately approved retention
  procedure explicitly authorizes the deletion.

The database RPC `public.delete_case_permanently(uuid, text)` enforces the admin role,
requires the archived status, checks the confirmation text against the stored case
number, writes a `case.deleted_permanently` audit entry, and then deletes dependent rows
before deleting the case. The server captures document storage paths before calling the
RPC and then removes private bucket objects through the Supabase Storage API using
server-only credentials when configured.

The audit entry records only the case number and row counts for dependent records. It
does not store note bodies, document contents, credentials, or other sensitive case
material.
