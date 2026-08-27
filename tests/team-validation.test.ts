import { describe, expect, it } from "vitest";

import { assignCaseMemberSchema } from "@/features/team/validation";
import { canManageCaseAssignments } from "@/lib/domain/authorization";

describe("team access validation", () => {
  it("accepts a valid case assignment request", () => {
    const parsed = assignCaseMemberSchema.parse({
      caseId: "10000000-0000-4000-8000-000000000001",
      profileId: "10000000-0000-4000-8000-000000000002",
      role: "assigned paralegal"
    });

    expect(parsed.role).toBe("assigned paralegal");
  });

  it("requires admins or lawyers for case assignment management", () => {
    expect(canManageCaseAssignments("admin")).toBe(true);
    expect(canManageCaseAssignments("lawyer")).toBe(true);
    expect(canManageCaseAssignments("paralegal")).toBe(false);
    expect(canManageCaseAssignments("read_only")).toBe(false);
  });
});
