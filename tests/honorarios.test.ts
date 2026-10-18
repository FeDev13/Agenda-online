import { describe, expect, it } from "vitest";
import { feeEstimateSchema, formatFee } from "@/features/honorarios/validation";

const input = {
  caseId: "22000000-0000-4000-8000-000000000001",
  currency: "ARS",
  amount: "123,45",
  expectedRevision: "0"
};
describe("fee estimates", () => {
  it("parses exact cents and permits an explicit zero", () => {
    expect(feeEstimateSchema.parse(input).amount).toBe(12345);
    expect(feeEstimateSchema.parse({ ...input, amount: "0" }).amount).toBe(0);
    expect(feeEstimateSchema.parse({ ...input, amount: "0.29" }).amount).toBe(29);
  });
  it.each(["-1", "1.001", "1e3", "", "Infinity", "10000000000", "1.234,56"])(
    "rejects invalid amount %s",
    (amount) => {
      expect(feeEstimateSchema.safeParse({ ...input, amount }).success).toBe(false);
    }
  );
  it("rejects unsupported currencies and invalid revisions", () => {
    expect(feeEstimateSchema.safeParse({ ...input, currency: "EUR" }).success).toBe(
      false
    );
    expect(
      feeEstimateSchema.safeParse({ ...input, expectedRevision: "-1" }).success
    ).toBe(false);
  });
  it("labels currencies explicitly", () => {
    expect(formatFee(12345, "USD")).toBe("USD 123,45");
  });
});
