import { describe, expect, it } from "vitest";

import {
  assignCaseMemberSchema,
  deactivateFirmMemberSchema,
  inviteFirmMemberSchema,
  removeCaseAssignmentSchema,
  updateFirmMemberRoleSchema
} from "@/features/team/validation";
import {
  canManageCaseAssignments,
  canManageFirmMemberships
} from "@/lib/domain/authorization";

describe("team access validation", () => {
  it("accepts a valid case assignment request", () => {
    const parsed = assignCaseMemberSchema.parse({
      caseId: "10000000-0000-4000-8000-000000000001",
      profileId: "10000000-0000-4000-8000-000000000002",
      role: "assigned paralegal"
    });

    expect(parsed.role).toBe("assigned paralegal");
  });

  it("validates member lifecycle requests", () => {
    expect(
      removeCaseAssignmentSchema.parse({
        caseId: "10000000-0000-4000-8000-000000000001",
        profileId: "10000000-0000-4000-8000-000000000002"
      })
    ).toMatchObject({
      caseId: "10000000-0000-4000-8000-000000000001",
      profileId: "10000000-0000-4000-8000-000000000002"
    });

    expect(
      updateFirmMemberRoleSchema.parse({
        profileId: "10000000-0000-4000-8000-000000000002",
        role: "lawyer"
      }).role
    ).toBe("lawyer");

    expect(
      updateFirmMemberRoleSchema.safeParse({
        profileId: "10000000-0000-4000-8000-000000000002",
        role: "owner"
      }).success
    ).toBe(false);

    expect(
      deactivateFirmMemberSchema.parse({
        profileId: "10000000-0000-4000-8000-000000000002"
      }).profileId
    ).toBe("10000000-0000-4000-8000-000000000002");
  });

  it("validates invite requests", () => {
    expect(
      inviteFirmMemberSchema.parse({
        displayName: "  Nueva Persona  ",
        email: "NEW.USER@EXAMPLE.TEST",
        role: "read_only"
      })
    ).toMatchObject({
      displayName: "Nueva Persona",
      email: "new.user@example.test",
      role: "read_only"
    });

    expect(
      inviteFirmMemberSchema.safeParse({
        displayName: "",
        email: "invalid",
        role: "admin"
      }).success
    ).toBe(false);

    expect(
      inviteFirmMemberSchema.safeParse({
        displayName: "",
        email: "new.user@example.test",
        role: "owner"
      }).success
    ).toBe(false);
  });

  it("requires admins or lawyers for case assignment management", () => {
    expect(canManageCaseAssignments("admin")).toBe(true);
    expect(canManageCaseAssignments("lawyer")).toBe(true);
    expect(canManageCaseAssignments("paralegal")).toBe(false);
    expect(canManageCaseAssignments("read_only")).toBe(false);
  });

  it("restricts firm membership management to admins", () => {
    expect(canManageFirmMemberships("admin")).toBe(true);
    expect(canManageFirmMemberships("lawyer")).toBe(false);
    expect(canManageFirmMemberships("paralegal")).toBe(false);
    expect(canManageFirmMemberships("read_only")).toBe(false);
  });
});
