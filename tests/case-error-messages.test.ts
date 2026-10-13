import { describe, expect, it } from "vitest";

import { toCreateCaseErrorMessage } from "@/features/cases/error-messages";

describe("case creation error messages", () => {
  it("maps duplicate case numbers to a specific form error", () => {
    expect(toCreateCaseErrorMessage({ code: "23505" })).toBe(
      "Ya existe una causa con ese número."
    );
  });

  it("maps database authorization failures to a role error", () => {
    expect(toCreateCaseErrorMessage({ code: "42501" })).toBe(
      "Tu rol no permite crear causas."
    );
  });

  it("keeps unknown database failures generic", () => {
    expect(toCreateCaseErrorMessage({ code: "PGRST202" })).toBe(
      "No se pudo crear la causa."
    );
  });
});
