# MFA Runtime Enforcement Progress

## Goal

Require MFA before users can access authenticated firm data under `/app`.

## Intended Slice

- Add `/mfa/enroll` for users who must enroll a TOTP factor.
- Add `/mfa/verify` for users who have a factor but need an `aal2` session.
- Redirect protected app access to the correct MFA gate server-side.
- Keep existing invite-only sign-in and active-membership checks intact.
- Add focused tests for the new gate surfaces and security assumptions.

## Progress

- [x] Read current auth flow and Supabase MFA APIs.
- [x] Add MFA status helpers.
- [x] Add MFA enroll route and server action.
- [x] Add MFA verify route and server action.
- [x] Enforce MFA on `/app`.
- [x] Add tests.
- [x] Run verification.

## Notes

- Email/password sign-in currently happens in `src/app/(auth)/sign-in/actions.ts`.
- Protected app access currently goes through `src/lib/server/auth.ts` and
  `src/lib/supabase/middleware.ts`.
- Local Supabase config already has TOTP enrollment and verification enabled.
- Installed Supabase Auth exposes `auth.mfa.enroll`, `auth.mfa.challenge`,
  `auth.mfa.verify`, `auth.mfa.challengeAndVerify`, `auth.mfa.listFactors`, and
  `auth.mfa.getAuthenticatorAssuranceLevel`.
- MFA routes were added under the `(auth)` route group:
  - `/mfa/enroll`
  - `/mfa/verify`
- `/app` now uses `requireMfaVerified("/app")` before rendering authenticated
  shell data.
- Playwright sign-in helper now completes TOTP enrollment and verification for
  seeded users during serial E2E runs.

## Verification

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
