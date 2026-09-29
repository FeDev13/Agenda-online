import { describe, expect, it } from "vitest";

import { isProtectedAppPath, sanitizeProtectedNextPath } from "@/lib/routes";

describe("route helpers", () => {
  it("matches only the authenticated app surface", () => {
    expect(isProtectedAppPath("/app")).toBe(true);
    expect(isProtectedAppPath("/app/cases")).toBe(true);
    expect(isProtectedAppPath("/application")).toBe(false);
    expect(isProtectedAppPath("/sign-in")).toBe(false);
  });

  it("sanitizes post-auth redirects to protected app paths", () => {
    expect(sanitizeProtectedNextPath("/app")).toBe("/app");
    expect(sanitizeProtectedNextPath("/app/calendar")).toBe("/app/calendar");
    expect(sanitizeProtectedNextPath("/application")).toBe("/app");
    expect(sanitizeProtectedNextPath("https://example.test/app")).toBe("/app");
    expect(sanitizeProtectedNextPath(["/app", "/app/cases"])).toBe("/app");
    expect(sanitizeProtectedNextPath(null)).toBe("/app");
  });
});
