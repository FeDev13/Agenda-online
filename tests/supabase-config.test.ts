import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const config = readFileSync(join(process.cwd(), "supabase/config.toml"), "utf8");
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
  });

  it("keeps document storage private and exposes the TOTP MFA path", () => {
    expect(config).toContain('[storage.buckets."case-documents"]');
    expect(config).toMatch(/\[storage\.buckets\."case-documents"\][\s\S]*public = false/);
    expect(config).toMatch(/\[auth\.mfa\.totp\][\s\S]*enroll_enabled = true/);
    expect(config).toMatch(/\[auth\.mfa\.totp\][\s\S]*verify_enabled = true/);
  });
});
