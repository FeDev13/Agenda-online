# Milestone 001 Progress

Date: 2026-08-28

## Scope

This milestone establishes the first usable vertical slice for the internal law-firm case scheduling application.

The implementation follows `AGENTS.md` as the authority for architecture, confidentiality, tenancy, authorization, storage, and testing requirements.

## Implemented

- Next.js App Router application with React, strict TypeScript, and pnpm.
- Protected `/app` application area with Supabase SSR session refresh through the Next.js proxy convention.
- Invite-only sign-in architecture using Supabase Auth password sign-in.
- Authenticated app shell with dashboard, open-cases page, calendar/deadlines page, navigation, user role display, and sign-out.
- Server-only data-access layer for case and scheduling reads/mutations.
- Zod validation for case creation, event creation, deadline creation, date-only values, local datetimes, and IANA timezones.
- Open case listing and case creation through PostgreSQL RPC.
- Upcoming event and legal-deadline listing.
- Event creation using local wall-clock input plus IANA timezone, converted by PostgreSQL to `timestamptz`.
- Legal deadline creation using PostgreSQL `date` values to preserve date-only semantics.
- Team access page for firm members, current case assignments, assigning/removing case access, changing roles, deactivating members, and reviewing recent audit entries.
- Case detail page for reviewing case context, notes, tasks, and private document metadata.
- Case work creation for notes, tasks, and private document uploads by admins, lawyers, and assigned paralegals.
- Note archival and task status transitions for authorized case-work users.
- Short-lived signed document download route after server authorization and audit recording.
- Supabase CLI-managed local stack configuration in `supabase/config.toml`.
- Private `case-documents` storage bucket configuration and storage object RLS policies.
- Reproducible initial migration for core entities, grants, functions, triggers, indexes, and RLS policies.
- Synthetic seed file only; no real client, case, document, export, or production credential data.

## Security Posture

- PostgreSQL remains the source of truth.
- Sensitive reads and all current domain mutations are centralized in `src/lib/server/`.
- Browser-exposed runtime configuration is limited to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Anonymous schema, table, and routine access is explicitly revoked in the migration.
- RLS is enabled and forced on all exposed core tables.
- Access requires active firm membership.
- Case-restricted rows require firm-wide role access or explicit case assignment.
- Cross-firm access is denied by shared PostgreSQL helper functions.
- No hard-delete grants are provided for core business tables. Case assignment edges can be deleted to revoke explicit access, with the removal retained in audit entries.
- Audit logging is append-only through grants and avoids sensitive payloads.
- Local Supabase Auth public signup is disabled globally; the email provider remains enabled so invited or seeded users can sign in.
- Local TOTP MFA enrollment and verification are enabled as the implementation path for mandatory MFA.
- `read_only` users retain assigned-case visibility but are denied case-work mutations by server code and RLS.

## Verification Completed

The following commands passed on the current implementation:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm db:start
pnpm db:reset
pnpm test:db
```

Fast tests passed with 6 files and 34 tests.

Database tests passed with 1 pgTAP file and 14 tests after running against the local Supabase CLI-managed PostgreSQL database.

Playwright browser tests passed with 3 tests covering sign-in, case creation, case work, document upload/download surfaces, schedule entry creation, assignment add/remove, and read-only denial paths.

The database test suite covers:

- Same-firm positive access.
- Cross-firm read denial.
- Cross-firm insert denial.
- Case assignment access for paralegals.
- Case assignment removal and revoked assigned-case visibility.
- Read-only scheduling mutation denial.
- Read-only notes, tasks, and document metadata mutation denial.
- Date-only legal deadline persistence.
- Timezone-retaining event persistence.

## Docker and Supabase Notes

Docker was initially unavailable in the WSL distro. After Docker was started and the command was rerun with access to the Docker socket, Supabase CLI successfully pulled the required local-stack images.

`pnpm db:start` started the local Supabase stack, applied the initial migration, seeded synthetic data, and configured the private `case-documents` bucket.

`pnpm db:reset` recreated the local database from migrations and seed data successfully.

`pnpm test:db` initially exposed two incorrect pgTAP assertion signatures. PostgreSQL was denying access correctly, but the test descriptions were placed in the expected-message argument. The assertions were corrected and the database test suite passed.

The local Supabase stack may still be running. Stop it with:

```bash
pnpm db:stop
```

## Local Demo Accounts

After `pnpm db:reset`, local Supabase contains these synthetic accounts. They are for local MVP testing only.

| Email                    | Password         | Role      | Notes                                             |
| ------------------------ | ---------------- | --------- | ------------------------------------------------- |
| `admin@example.test`     | `Agenda-demo-1!` | admin     | Can create cases and assign case access.          |
| `lawyer@example.test`    | `Agenda-demo-1!` | lawyer    | Can create cases and assign case access.          |
| `paralegal@example.test` | `Agenda-demo-1!` | paralegal | Can create scheduling entries for assigned cases. |
| `reader@example.test`    | `Agenda-demo-1!` | read_only | Can read assigned cases only.                     |
| `outside@example.test`   | `Agenda-demo-1!` | lawyer    | Separate synthetic firm for cross-firm checks.    |

## Bundle and Environment Review

A search of `.next/static` and `.next/server` found no `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_DB_PASSWORD` references.

Source references to privileged Supabase values are limited to `.env.example` and documentation. Runtime Supabase clients use publishable values only.

No authoritative application state is stored in `localStorage`.

## Important Decisions

- Do not add a separate backend service for this milestone.
- Use Supabase CLI-managed containers only for local Supabase development.
- Run Next.js directly with `pnpm dev`.
- Keep legal deadline entry manual and user-confirmed; no automated substantive legal-deadline calculations are implemented.
- Use `America/Argentina/Buenos_Aires` as the default date-boundary display timezone until firm-level configuration is wired into the schedule query path.
- Keep generated Supabase TypeScript types as future work; the current `Database` type is hand-maintained for the initial slice.
- Prioritize case-assignment management before broader user administration because role-restricted access is central to the MVP.
- Create document metadata immediately before private file upload and archive the metadata row if storage upload fails.

## Remaining Production Work

- Enforce MFA at runtime through Supabase Auth assurance level checks or mandatory managed SSO before storing real firm data.
- Build administrator invite and firm bootstrap workflows.
- Generate Supabase TypeScript types from the live schema.
- Expand Playwright and integration coverage for every role and core entity as workflows are added.
- Document and test database backup/restore separately from document-storage backup/restore.
- Define retention, export, account recovery, incident response, production rollback, and forward-fix procedures.
- Complete dependency vulnerability review and CI enforcement before production launch.

## Recommended Next Milestone

Extend administration and operational hardening:

- Add invite administration and firm bootstrap flows.
- Add runtime MFA enforcement through Supabase assurance level checks or managed SSO policy.
