import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const config = readFileSync(join(process.cwd(), "supabase/config.toml"), "utf8");
const hostedAuthChecklist = readFileSync(
  join(process.cwd(), "docs/hosted-auth-production-checklist.md"),
  "utf8"
);
const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf8")
) as {
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

describe("Supabase local project configuration", () => {
  it("uses the CLI-managed local stack with invite-only auth defaults", () => {
    expect(packageJson.devDependencies?.supabase).toBeDefined();
    expect(packageJson.scripts?.["db:start"]).toBe("supabase start");
    expect(packageJson.scripts?.["db:reset"]).toBe("supabase db reset");
    expect(packageJson.scripts?.["test:db"]).toBe("supabase test db supabase/tests");
    expect(config).toMatch(/\[auth\][\s\S]*enable_signup = false/);
    expect(config).toMatch(/\[auth\.email\][\s\S]*enable_signup = true/);
    expect(config).toContain("http://localhost:3000/auth/callback/reset-password");
    expect(config).toContain("http://127.0.0.1:3000/auth/callback/reset-password");
  });

  it("keeps document storage private and exposes the TOTP MFA path", () => {
    expect(config).toContain('[storage.buckets."case-documents"]');
    expect(config).toMatch(/\[storage\.buckets\."case-documents"\][\s\S]*public = false/);
    expect(config).toMatch(/\[auth\.mfa\.totp\][\s\S]*enroll_enabled = true/);
    expect(config).toMatch(/\[auth\.mfa\.totp\][\s\S]*verify_enabled = true/);
  });

  it("bounds authenticated sessions", () => {
    expect(config).toMatch(/\[auth\.sessions\][\s\S]*timebox = "12h"/);
    expect(config).toMatch(/\[auth\.sessions\][\s\S]*inactivity_timeout = "2h"/);
  });

  it("documents the hosted Auth production parity checklist", () => {
    expect(hostedAuthChecklist).toContain("Public signup is disabled");
    expect(hostedAuthChecklist).toContain("administrator invites");
    expect(hostedAuthChecklist).toContain("approved bootstrap procedure");
    expect(hostedAuthChecklist).toContain(
      "https://<app-domain>/auth/callback/reset-password"
    );
    expect(hostedAuthChecklist).toContain("TOTP enrollment is enabled");
    expect(hostedAuthChecklist).toContain("TOTP verification is enabled");
    expect(hostedAuthChecklist).toContain("Session timebox is set to 12 hours or less");
    expect(hostedAuthChecklist).toContain(
      "Inactivity timeout is set to 2 hours or less"
    );
    expect(hostedAuthChecklist).toContain(
      "Minimum password length is 12 characters or more"
    );
    expect(hostedAuthChecklist).toContain(
      "lowercase letters, uppercase letters, digits, and symbols"
    );
    expect(hostedAuthChecklist).toContain("Hosted edge or WAF rate limiting");
  });
});
