# Architecture Notes

## Decisions

- Use Next.js App Router for UI, server components, server actions, proxy, and protected routing.
- Use Supabase Auth for identity. The application does not store passwords or implement session cryptography.
- Use PostgreSQL as the system of record. Supabase RLS is the second authorization boundary behind server-only checks.
- Use Supabase CLI-managed containers for local PostgreSQL, Auth, Storage, Studio, and related services. Do not add a separate custom Docker Compose stack for Supabase.
- Keep legal deadlines in `case_deadlines.due_on` as `date` values. Timed events use `events.starts_at` and `events.ends_at` as `timestamptz` plus the original IANA timezone.
- Keep documents private in Supabase Storage. Database rows store metadata only.
- Keep the current Next.js runtime credential surface to publishable Supabase values. Service-role credentials are reserved for future server-only administrative scripts and must not be imported into browser code.

## Consequential Assumptions

- A user belongs to one active firm for this milestone. Multi-firm switching can be added by selecting among active memberships.
- `admin` and `lawyer` roles are firm-wide case access roles. `paralegal` and `read_only` require explicit case assignment for case-restricted records.
- Legal deadline entries in this milestone are manually entered and confirmed by the user. No substantive legal deadline calculation is automated.
- Mandatory MFA is configured as a product requirement and local Supabase TOTP support is enabled. Runtime enforcement should be completed before real data is stored by validating Auth assurance level or by requiring managed organizational SSO.
