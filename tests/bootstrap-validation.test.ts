import { describe, expect, it } from "vitest";

import { bootstrapFirmSchema } from "@/features/bootstrap/validation";

describe("firm bootstrap validation", () => {
  it("normalizes valid bootstrap input", () => {
    expect(
      bootstrapFirmSchema.parse({
        adminDisplayName: "  Admin Inicial  ",
        adminEmail: "ADMIN@EXAMPLE.TEST",
        bootstrapToken: "token",
        defaultTimezone: "America/Argentina/Buenos_Aires",
        firmName: "  Estudio Inicial  "
      })
    ).toMatchObject({
      adminDisplayName: "Admin Inicial",
      adminEmail: "admin@example.test",
      defaultTimezone: "America/Argentina/Buenos_Aires",
      firmName: "Estudio Inicial"
    });
  });

  it("rejects missing token and invalid admin email", () => {
    expect(
      bootstrapFirmSchema.safeParse({
        adminEmail: "invalid",
        bootstrapToken: "",
        defaultTimezone: "America/Argentina/Buenos_Aires",
        firmName: "Estudio Inicial"
      }).success
    ).toBe(false);
  });
});
