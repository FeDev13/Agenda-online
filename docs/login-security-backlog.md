# Login Security Backlog

Resend delivery work is intentionally paused while DNS and domain setup is resolved.
The remaining login-security work is:

1. `[started]` Build an administrator invite and firm bootstrap workflow so user access is created
   through audited invite flows instead of manual dashboard setup.
2. `[started]` Add password reset and recovery policy/UI with generic client-facing errors and no
   account enumeration.
3. `[todo]` Define MFA recovery and offboarding procedures, especially for lost authenticator
   devices and disabled users.
4. `[todo]` Decide whether hosted sign-in needs CAPTCHA or edge rate limiting beyond Supabase Auth
   rate limits.
5. `[todo]` Keep a production checklist verifying hosted Supabase Auth matches local security
   posture: signup disabled, MFA enabled, session limits, and password policy.

## Step 2 Notes

- Recovery requests use one generic success message after syntactically valid email input.
- The request UI does not reveal whether the email has an account or an active invitation.
- Recovery links redirect through `/auth/callback/reset-password`, then to
  `/reset-password/update` after Supabase exchanges the code for a session.
- Password updates reuse the configured policy: at least 12 characters with lowercase,
  uppercase, digit, and symbol requirements.
- Successful password updates sign the user out and require a fresh sign-in.
