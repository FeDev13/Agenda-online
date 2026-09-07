# Agenda Legal

Internal case scheduling foundation for a law firm. The app is built with Next.js App Router, React, strict TypeScript, Supabase Auth, PostgreSQL, private Supabase Storage, and PostgreSQL Row Level Security. Use synthetic data only until the security, privacy, backup, and operational reviews are complete.

## Architecture

- `src/app/` contains App Router routes, layouts, server actions, loading/error surfaces, and protected screens.
- `src/lib/server/` contains server-only data access and domain mutations. Sensitive reads and all current mutations go through this layer.
- `src/lib/supabase/` contains Supabase SSR/browser client factories and proxy session refresh.
- `src/features/` contains feature-specific validation and workflow code.
- `supabase/migrations/` contains reproducible schema, grants, functions, storage setup, and RLS policies.
- `supabase/tests/` contains pgTAP database/RLS tests for the Supabase CLI-managed local database.
- `tests/` contains fast domain, validation, route, config, and migration security tests.
- `docs/` records architecture decisions and assumptions.

PostgreSQL is the source of truth. Browser state and `localStorage` are not authoritative storage. Runtime app code uses Supabase publishable credentials only; the service-role key is not required by the Next.js application and must stay server-only for future administrative tooling.

Current implementation progress and verification results are recorded in [`docs/milestone-001-progress.md`](docs/milestone-001-progress.md).

## Implemented Vertical Slice

- Invite-only sign-in page backed by Supabase Auth password sign-in.
- Proxy-based session refresh and route protection for `/app`.
- Authenticated shell with dashboard, open cases, calendar/deadlines navigation, user identity, role display, and sign-out.
- Open case listing and case creation through server-only services and PostgreSQL RPC.
- Upcoming event/deadline listing.
- Event creation using local wall-clock time plus IANA timezone, converted in PostgreSQL to `timestamptz`.
- Legal deadline creation using PostgreSQL `date`, preserving date-only semantics.
- Team access page for viewing firm members, assigning/removing case access, changing roles, deactivating members, and reviewing recent audit entries.
- Case detail page for reviewing case context, notes, tasks, and private document metadata.
- Case work creation for notes, tasks, and private document uploads by admins, lawyers, and assigned paralegals.
- Note archival and task status transitions for authorized case-work users.
- Short-lived signed document download route after server authorization.
- Initial schema for firms, profiles, memberships, clients, cases, case members, events, legal deadlines, tasks, reminders, notes, documents, and audit log.
- Private `case-documents` storage bucket and storage object RLS policies.

## Prerequisites

- Node and pnpm matching `.prototools` (`node 24.14.1`, `pnpm 10.19.0`) or compatible local versions.
- Docker Desktop or a compatible Docker engine for `supabase start`, `supabase db reset`, and `supabase test db`.
- Supabase CLI installed through the project dev dependency. Use `pnpm install` before running CLI scripts.

## Environment Configuration

Create local environment values:

```bash
cp .env.example .env.local
```

Set at least:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

For local Supabase, `pnpm db:start` prints the API URL and anon/publishable key. Put those values in `.env.local`. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and out of browser-exposed variables.

## Docker and Local Supabase

This project uses only Supabase CLI-managed containers for local PostgreSQL, Auth, Storage, Studio, and related services. The Next.js app runs directly on the host with `pnpm dev`; there is no custom Docker Compose stack for the web app.

```bash
pnpm install
pnpm db:start
pnpm db:reset
pnpm db:status
pnpm test:db
pnpm db:stop
```

Local Supabase config lives in `supabase/config.toml`. Public signup is disabled globally in the local config; the email provider remains enabled so invited or seeded users can sign in. Users should be created through Supabase invite/admin flows, not public self-registration. TOTP MFA enrollment and verification are enabled locally as the implementation path for mandatory MFA.

## Migrations and Synthetic Seeds

Migrations live in `supabase/migrations/`. The initial migration creates the core schema, helper functions, RPC mutations, RLS policies, explicit grants, an append-only audit-log foundation, and a private `case-documents` storage bucket.

`supabase/seed.sql` contains synthetic reference setup only. It does not include real users, clients, cases, documents, credentials, exports, or personal data.

After `pnpm db:reset`, the local database contains synthetic demo accounts:

| Email                    | Password         | Role      | Notes                                                       |
| ------------------------ | ---------------- | --------- | ----------------------------------------------------------- |
| `admin@example.test`     | `Agenda-demo-1!` | admin     | Can create cases and assign case access.                    |
| `lawyer@example.test`    | `Agenda-demo-1!` | lawyer    | Can create cases and assign case access.                    |
| `paralegal@example.test` | `Agenda-demo-1!` | paralegal | Can create scheduling entries for assigned cases.           |
| `reader@example.test`    | `Agenda-demo-1!` | read_only | Can read assigned cases only.                               |
| `outside@example.test`   | `Agenda-demo-1!` | lawyer    | Belongs to a separate synthetic firm for cross-firm checks. |

## Development Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:smoke
pnpm test:e2e
pnpm test:db
pnpm build
pnpm format
```

`pnpm test:smoke` runs static route smoke checks with Vitest. `pnpm test:e2e` runs Playwright browser tests against the local Next.js app and Supabase seed users.

## Testing

Fast tests cover:

- Domain authorization rules, including cross-firm denial.
- Zod validation for case creation, date-only deadlines, impossible dates, local event times, IANA timezones, and event ordering boundaries.
- Team access validation for case assignment requests and role boundaries.
- Case detail validation for notes, tasks, task status transitions, note archival, document metadata, and document upload metadata.
- Static migration checks for RLS, no hard-delete grants, anonymous revocation, private storage policies, and cross-firm helper functions.
- Supabase CLI config checks for invite-only auth defaults, private storage, CLI scripts, and TOTP MFA configuration.
- Playwright browser coverage for sign-in, case creation, assignment add/remove, schedule entry creation, case work creation, document upload/download surfaces, and read-only denial paths.

Database tests under `supabase/tests/rls.sql` are pgTAP tests intended for `pnpm test:db` after the local Supabase stack is running. They exercise positive and negative RLS behavior, including cross-firm denial, case assignment, read-only mutation denial, case-work mutation denial, date-only deadlines, and timezone-retaining events.

## Remote Supabase Setup

1. Create or select a Supabase project in the approved region for the firm.
2. Review data-processing terms, professional-confidentiality obligations, and storage region requirements before storing real data.
3. Apply migrations from `supabase/migrations/` using the Supabase CLI or approved release process.
4. Disable public signup in the remote Auth settings. Use administrator invites only.
5. Require MFA with Supabase Auth TOTP or managed organizational SSO before granting access to real firm data.
6. Keep the `case-documents` bucket private. Object names are expected to use `firm_id/case_id/file-name`.
7. Store production secrets in the deployment platform and Supabase settings, never in Git.

## Security Model

- Access requires an active `firm_memberships` row.
- `admin` and `lawyer` roles have firm-wide case visibility.
- `paralegal` and `read_only` require explicit case assignment for case-restricted records.
- `read_only` can view assigned case records but cannot create notes, tasks, reminders, scheduling entries, document uploads, document metadata, or assignments.
- Mutations are checked in server-only code and again by PostgreSQL RLS/RPC functions.
- Cross-firm access is denied by helper functions used by policies.
- Anonymous database access is explicitly revoked for the application schema.
- No hard-delete grants are provided for cases, notes, audit entries, documents, or other core business rows. Case assignment edges can be deleted to revoke explicit access, with the removal recorded in the audit log.
- Audit entries are append-only and avoid note bodies, document contents, credentials, and tokens.

## Security Limitations and Production Readiness Remaining

- Complete runtime MFA enforcement by checking Supabase Auth assurance level or relying on mandatory managed SSO policy before using real firm data.
- Build an invite administration workflow and firm bootstrap procedure.
- Generate Supabase TypeScript types from the live schema to replace the hand-maintained initial `Database` type.
- Expand Playwright coverage for additional role boundaries and future workflows.
- Expand role-by-role integration coverage for all core entities as workflows are added.
- Document and test database backup/restore and document-storage restore separately.
- Define retention, export, account recovery, incident response, production rollback, and forward-fix procedures.
- Run dependency vulnerability review and configure CI checks before production launch.
