# Hosted Auth Production Checklist

Use this checklist before storing real firm data in a hosted Supabase project and
repeat it after any Auth, hosting, or identity-provider change. Record the date,
Supabase project reference, application deployment, reviewer, and any approved
exceptions in the release notes or security review record. Do not commit
screenshots or exports that contain secrets, user tokens, or real personal data.

The local baseline is `supabase/config.toml`. Hosted settings must match the
security posture below unless an approved firm policy is stricter.

## Supabase Auth Settings

- [ ] Public signup is disabled at the project level. User access is created
  through administrator invites or an approved bootstrap procedure, not public
  self-registration.
- [ ] Email authentication remains enabled for invited users. Do not enable
  anonymous sign-ins, manual account linking, phone signup, or external OAuth
  providers unless an approved identity decision covers the provider.
- [ ] The production site URL is the canonical app origin.
- [ ] The password recovery callback is allow-listed:
  `https://<app-domain>/auth/callback/reset-password`.
- [ ] Refresh token rotation is enabled, with a short reuse interval comparable
  to local development.

## MFA

- [ ] TOTP enrollment is enabled.
- [ ] TOTP verification is enabled.
- [ ] Phone MFA is disabled unless the firm has approved SMS risk and retention
  handling.
- [ ] The app deployment being reviewed enforces MFA before `/app` renders firm
  data through the server-side assurance-level check.
- [ ] If managed SSO replaces TOTP for a firm, the SSO policy must require MFA
  upstream and the exception must be documented in the security review record.

## Sessions

- [ ] Session timebox is set to 12 hours or less.
- [ ] Inactivity timeout is set to 2 hours or less.
- [ ] JWT expiry is no longer than the local 1-hour baseline unless the firm has
  approved a stricter compensating control.

## Password Policy

- [ ] Minimum password length is 12 characters or more.
- [ ] Password requirements include lowercase letters, uppercase letters, digits, and symbols.
- [ ] Secure password change or recent-login enforcement is enabled.
- [ ] Password recovery emails use the hosted callback above and the application
  keeps generic request responses to avoid account enumeration.

## Abuse Controls

- [ ] Supabase Auth rate limits are reviewed against the hosted plan defaults.
- [ ] Hosted edge or WAF rate limiting is active for `/sign-in`,
  `/reset-password`, `/mfa/verify`, and `/mfa/enroll` form posts.
- [ ] CAPTCHA is disabled by default for the internal invite-only workflow, or
  enabled with Cloudflare Turnstile or hCaptcha only after the Step 4 criteria
  are met.

## Evidence

- [ ] Reviewer confirmed the hosted settings against this checklist.
- [ ] Reviewer ran local verification for `tests/supabase-config.test.ts`.
- [ ] Any deviation from the local baseline has an owner, expiry date, and
  mitigation.
