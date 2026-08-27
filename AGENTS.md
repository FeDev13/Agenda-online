Repository Guidelines

## Product Scope

This repository contains an internal web application for a law firm to manage clients, open cases, calendar events, legal deadlines, tasks, notes, reminders, and related documents. Treat all case and client information as confidential.

The initial architecture is:

- Next.js App Router with React and TypeScript.
- Supabase for managed PostgreSQL, authentication, and private file storage.
- A server-only data-access layer for authorization and domain operations.
- PostgreSQL Row Level Security (RLS) as a second authorization boundary.

Do not introduce a separate backend service unless a documented requirement justifies it. Complex integrations, background workloads, or a public API may later justify a NestJS service, but PostgreSQL remains the system of record.

## Project Structure & Module Organization

Use a predictable feature-oriented structure as the application is created:

- `src/app/` for Next.js routes, layouts, loading states, and error boundaries.
- `src/components/` for reusable presentation components.
- `src/features/` for case, client, calendar, task, document, and user workflows.
- `src/lib/server/` for server-only data access, authorization, and domain services.
- `src/lib/supabase/` for typed Supabase client factories and shared integration code.
- `src/types/` for shared application types when they do not belong to one feature.
- `supabase/migrations/` for database schema, grants, functions, triggers, and RLS policies.
- `tests/` for integration and end-to-end tests not colocated with source files.
- `public/` for non-confidential static assets.
- `docs/` for architecture decisions, data-flow notes, threat modeling, and operational procedures.

Prefer colocating feature-specific components, schemas, and tests inside their feature. Do not place confidential fixtures, client documents, production exports, or real personal data in the repository or `public/`.

## Architecture & Data Access

- Treat PostgreSQL as the source of truth. Do not use `localStorage` or browser state as authoritative storage.
- Centralize sensitive reads and all domain mutations in `src/lib/server/`. Mark server-only modules accordingly.
- Re-authorize every mutation on the server. Hiding a button or checking a role in the browser is not authorization.
- Return minimal data-transfer objects to the client; do not select or serialize fields a screen does not need.
- Use Supabase's publishable client credentials only where appropriate. Never expose the service-role key or other privileged credentials to browser code.
- Keep schema changes reproducible in migrations. Do not rely on undocumented dashboard-only database changes.
- Validate external input at the server boundary with Zod or an equivalent schema validator.

## Core Data Model Rules

The expected core entities are `firms`, `profiles`, `firm_memberships`, `clients`, `cases`, `case_members`, `events`, `tasks`, `reminders`, `notes`, `documents`, and `audit_log`.

- Every firm-owned business row must contain a non-null `firm_id` and an appropriate foreign key.
- Access must require active firm membership. Case-restricted information must additionally require case assignment or an explicitly authorized firm-wide role.
- Use database constraints and foreign keys to enforce invariants rather than relying only on application code.
- Prefer UUID primary keys and explicit `created_at`, `updated_at`, and actor fields where relevant.
- Store timed instants as `timestamptz` in UTC and retain the applicable IANA timezone when needed. The default display timezone is `America/Argentina/Buenos_Aires` unless the firm configures another one.
- Store genuinely date-only legal deadlines as PostgreSQL `date` values so timezone conversion cannot move them to another calendar day.
- Keep events, deadlines, tasks, and reminders distinct even when they appear in one calendar UI.
- Do not hard-delete cases, notes, audit entries, or documents unless an approved retention rule explicitly requires it. Prefer archival or status transitions.
- Any automated legal-deadline calculation must state its rule source, expose the calculation, and require human confirmation. Never silently treat a computed deadline as authoritative.

## Authentication, Authorization & Confidentiality

- Use managed Supabase Auth; do not implement password storage or session cryptography in application code.
- Registration is invite-only. Do not add public self-registration without an explicit product decision.
- Require multi-factor authentication for access to real firm data. Prefer authenticator-app TOTP or managed organizational SSO.
- Model authorization with explicit roles such as `admin`, `lawyer`, `paralegal`, and `read_only`, plus case assignments where applicable.
- Enable RLS on every exposed firm-owned table and view. Define grants and separate policies for each required operation.
- Deny access by default. Policies must prevent cross-firm access even when a user supplies another firm's record ID.
- Keep document buckets private and authorize access with RLS or short-lived signed URLs.
- Record security-relevant and material case-data actions in an append-only audit trail, including actor, firm, action, target, and timestamp. Do not put note bodies, document contents, credentials, tokens, or other unnecessary sensitive values in logs.
- Use generic client-facing error messages for authentication and authorization failures while preserving safe diagnostic context server-side.
- Apply least privilege to database roles, deployment credentials, CI credentials, and third-party integrations.

## Build, Test & Development Commands

Use `pnpm` unless the repository already contains a different package-manager lockfile. Never introduce multiple lockfiles.

Once the application is scaffolded, expose stable scripts for:

- `pnpm install` to install dependencies.
- `pnpm dev` to start the local development server.
- `pnpm lint` to run lint checks.
- `pnpm typecheck` to run TypeScript checking without emitting files.
- `pnpm test` to run unit and integration tests.
- `pnpm test:e2e` to run browser-level tests.
- `pnpm build` to create a production build.

Document required local services and environment variables in `README.md`. Provide a checked-in `.env.example` containing names and safe placeholders only.

## Coding Style & Naming Conventions

- Use TypeScript in strict mode and avoid `any`; justify narrow exceptions locally.
- Indent JavaScript, TypeScript, JSON, YAML, and Markdown with 2 spaces.
- Use `PascalCase` for React components, `camelCase` for functions and variables, and descriptive kebab-case file names unless framework conventions require otherwise.
- Keep modules focused on one responsibility. Avoid catch-all utility files and business logic embedded in UI components.
- Prefer clear domain terms such as `caseDeadline`, `caseMember`, and `firmMembership` over ambiguous names such as `item` or `record`.
- Run the configured formatter and linter. Avoid unrelated formatting changes in feature or bug-fix work.

## Testing Guidelines

Use unit tests for domain rules, integration tests for the database and data-access layer, and end-to-end tests for critical user workflows.

- Every feature must test the expected path and at least one important failure or boundary condition.
- Every authorization or RLS change must include positive and negative tests, including a cross-firm access attempt.
- Test each role's allowed and denied operations and any case-assignment restrictions.
- Test date-only deadlines, timezone boundaries, reminder behavior, and concurrent updates where relevant.
- Bug fixes should include a regression test when practical.
- Use synthetic data only. Never copy production client or case data into fixtures, snapshots, logs, screenshots, or test databases.
- Before merging, run linting, type checking, relevant tests, and a production build unless the change is documentation-only.

## Documents, Backups & Operations

- Uploaded documents must use private storage; do not store file contents in Git or public asset directories.
- Treat database backups and document-storage backups as separate concerns. Document both restore procedures and test them periodically before production use.
- Preserve an auditable migration history and document production rollback or forward-fix procedures.
- Define retention, export, account recovery, incident response, and user-offboarding procedures before storing real client data.
- Verify hosting region, data-processing terms, and applicable professional-confidentiality and privacy requirements before production launch.

## Commit & Pull Request Guidelines

Use concise imperative commit messages, for example `Add case assignment policy` or `Fix deadline timezone conversion`.

Pull requests should include:

- A short summary and the reason for the change.
- The commands run to verify it.
- Screenshots for material UI changes, using synthetic data only.
- Database migration, RLS, authorization, audit, and backup implications where applicable.
- Links to related issues or architecture decisions.

Keep each pull request scoped to one logical change. Call out security-sensitive behavior explicitly so reviewers can focus on it.

## Security & Configuration

Do not commit secrets, tokens, private keys, generated credentials, `.env` files, database exports, uploaded documents, or local service state. Keep privileged environment variables server-only and ensure browser-exposed variables contain no secret material.

Before using real firm data, complete a security review covering authentication, session handling, RLS, authorization tests, storage policies, audit logging, dependency vulnerabilities, backups, restoration, retention, and incident response.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
