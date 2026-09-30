import { describe, expect, it } from "vitest";

import {
  passwordResetRequestSchema,
  passwordUpdateSchema
} from "@/features/auth/password-recovery";

describe("password recovery validation", () => {
  it("normalizes recovery email input", () => {
    expect(
      passwordResetRequestSchema.parse({
        email: "USER@EXAMPLE.TEST"
      }).email
    ).toBe("user@example.test");
  });

  it("enforces the configured password policy", () => {
    expect(
      passwordUpdateSchema.parse({
        confirmPassword: "Agenda-reset-1!",
        password: "Agenda-reset-1!"
      }).password
    ).toBe("Agenda-reset-1!");

    expect(
      passwordUpdateSchema.safeParse({
        confirmPassword: "short",
        password: "short"
      }).success
    ).toBe(false);

    expect(
      passwordUpdateSchema.safeParse({
        confirmPassword: "Agenda-reset-1?",
        password: "Agenda-reset-1!"
      }).success
    ).toBe(false);
  });
});
