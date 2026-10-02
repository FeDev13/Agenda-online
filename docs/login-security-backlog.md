# Login Security Backlog

Resend delivery work is intentionally paused while DNS and domain setup is resolved.
The remaining login-security work is:

1. `[done]` Build an administrator invite and firm bootstrap workflow so user access is created
   through audited invite flows instead of manual dashboard setup.
2. `[done]` Add password reset and recovery policy/UI with generic client-facing errors and no
   account enumeration.
3. `[done]` Define MFA recovery and offboarding procedures, especially for lost authenticator
   devices and disabled users.
4. `[done]` Decide whether hosted sign-in needs CAPTCHA or edge rate limiting beyond Supabase Auth
   rate limits.
5. `[done]` Keep a production checklist verifying hosted Supabase Auth matches local security
   posture: signup disabled, MFA enabled, session limits, and password policy.

## Step 1 Notes

- Administrator invite administration exists on the team page and writes audit-log entries for
  invited, reinvited, accepted, role-updated, disabled, and MFA-reset membership lifecycle
  events.
- `/bootstrap` creates the initial firm and invited admin membership with a server-only
  `FIRM_BOOTSTRAP_TOKEN` and Supabase service-role client.
- Bootstrap sends the first admin through Supabase Auth invite, then records system audit
  entries for `firm.bootstrapped` and `membership.bootstrap_invited` without logging the
  bootstrap token.

## Step 2 Notes

- Recovery requests use one generic success message after syntactically valid email input.
- The request UI does not reveal whether the email has an account or an active invitation.
- Recovery links redirect through `/auth/callback/reset-password`, then to
  `/reset-password/update` after Supabase exchanges the code for a session.
- Password updates reuse the configured policy: at least 12 characters with lowercase,
  uppercase, digit, and symbol requirements.
- Successful password updates sign the user out and require a fresh sign-in.

## Step 3 Notes

- Lost authenticator recovery is admin-assisted only. An active admin must verify the
  requester out of band, then use **Restablecer MFA** on the team page.
- MFA reset deletes all registered factors for the selected active member. The next `/app`
  access redirects the member to MFA enrollment before any firm data renders.
- Admins cannot reset their own MFA from the app. If every admin is locked out, use a
  Supabase dashboard or SQL break-glass procedure, then record a manual incident note.
- Disabling a member removes their case assignments and deletes their MFA factors before
  marking the membership `disabled`.
- MFA resets and disabled-member offboarding write audit-log entries with target profile
  identifiers and counts only. Do not log recovery codes, TOTP secrets, note bodies, or
  other matter data.

## Step 4 Notes

- Hosted production must add an edge or WAF rate limit for `/sign-in`, `/reset-password`,
  `/mfa/verify`, and `/mfa/enroll` form posts before storing real firm data.
- Start with a conservative end-user-IP policy such as 10 sign-in attempts per 10 minutes
  and 5 password-recovery requests per hour, then tune from audit and hosting logs.
- Do not enable CAPTCHA by default for the internal invite-only workflow. Enable
  Cloudflare Turnstile or hCaptcha if abusive traffic appears, if the app becomes broadly
  public, or if the hosting layer cannot enforce end-user-IP limits.
- Supabase Auth rate limits remain required. Because the app uses server actions with the
  publishable Supabase client, hosted edge rate limiting is the control that preserves
  end-user-IP throttling without moving sign-in to a secret-key Auth client.

## Step 5 Notes

- Hosted Auth production verification lives in
  `docs/hosted-auth-production-checklist.md`.
- The checklist mirrors the local Supabase Auth posture: public signup disabled, invite-only
  email access, TOTP MFA enabled, 12-hour session timebox, 2-hour inactivity timeout, and
  a 12-character password policy requiring lowercase, uppercase, digits, and symbols.
- Complete the checklist before storing real firm data and after Auth, hosting, or
  identity-provider changes. Record evidence in release or security review notes, not in
  Git if it contains secrets or personal data.
