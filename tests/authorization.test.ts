import { describe, expect, it } from "vitest";

import {
  canAccessCase,
  canManageCaseAssignments,
  canManageCases,
  canManageCaseWork,
  canManageScheduling,
  isSameFirm,
  type ActiveMembership
} from "@/lib/domain/authorization";

const activeLawyer: ActiveMembership = {
  firmId: "firm-a",
  profileId: "user-a",
  role: "lawyer",
  status: "active"
};

const activeParalegal: ActiveMembership = {
  firmId: "firm-a",
  profileId: "user-b",
  role: "paralegal",
  status: "active"
};

describe("domain authorization", () => {
  it("denies cross-firm resource access before case-level checks", () => {
    expect(isSameFirm(activeLawyer, "firm-b")).toBe(false);
  });

  it("requires assignment for non-firm-wide case access", () => {
    expect(canAccessCase(activeParalegal, false)).toBe(false);
    expect(canAccessCase(activeParalegal, true)).toBe(true);
  });

  it("allows firm-wide case visibility to admins and lawyers", () => {
    expect(canAccessCase(activeLawyer, false)).toBe(true);
  });

  it("separates case creation from scheduling permissions", () => {
    expect(canManageCases("paralegal")).toBe(false);
    expect(canManageScheduling("paralegal")).toBe(true);
    expect(canManageCases("read_only")).toBe(false);
    expect(canManageScheduling("read_only")).toBe(false);
  });

  it("keeps read-only members out of case work and assignment mutations", () => {
    expect(canManageCaseWork("admin")).toBe(true);
    expect(canManageCaseWork("lawyer")).toBe(true);
    expect(canManageCaseWork("paralegal")).toBe(true);
    expect(canManageCaseWork("read_only")).toBe(false);
    expect(canManageCaseAssignments("paralegal")).toBe(false);
  });
});
