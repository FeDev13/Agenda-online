import { describe, expect, it } from "vitest";
import {
  createDeadlineSchema,
  updateDeadlineStatusSchema
} from "@/features/calendar/deadline-validation";
import { agendaHref, parseScheduleFilters } from "@/features/calendar/filters";

const caseId = "22000000-0000-4000-8000-000000000001";
describe("legal deadline lifecycle validation", () => {
  it("requires a real date, a source, and explicit human confirmation", () => {
    const input = {
      caseId,
      title: "Presentación sintética",
      dueOn: "2026-10-01",
      ruleSource: "Orden judicial revisada",
      confirmed: "on"
    };
    expect(createDeadlineSchema.safeParse(input).success).toBe(true);
    for (const update of [
      { dueOn: "2026-02-30" },
      { confirmed: null },
      { ruleSource: " " },
      { caseId: "other" }
    ]) {
      expect(createDeadlineSchema.safeParse({ ...input, ...update }).success).toBe(false);
    }
  });
  it("requires a revision and limits client states to human decisions", () => {
    expect(
      updateDeadlineStatusSchema.parse({
        deadlineId: caseId,
        status: "completed",
        expectedRevision: "3"
      }).expectedRevision
    ).toBe(3);
    for (const update of [
      { status: "needs_review" },
      { expectedRevision: null },
      { expectedRevision: -1 },
      { expectedRevision: ["1"] }
    ]) {
      expect(
        updateDeadlineStatusSchema.safeParse({
          deadlineId: caseId,
          status: "pending",
          expectedRevision: "0",
          ...update
        }).success
      ).toBe(false);
    }
  });
  it("retains filters while navigating lifecycle views and pages", () => {
    const filters = parseScheduleFilters({
      scope: "overdue",
      kind: "deadline",
      from: "2026-10-01",
      page: "2"
    });
    const url = new URL(
      agendaHref(filters, { scope: "resolved", page: 1 }),
      "https://example.test"
    );
    expect(url.searchParams.get("scope")).toBe("resolved");
    expect(url.searchParams.get("kind")).toBe("deadline");
    expect(url.searchParams.get("from")).toBe("2026-10-01");
    expect(url.searchParams.has("page")).toBe(false);
    for (const params of [
      { scope: "unknown" },
      { page: "0" },
      { page: ["2"] },
      { page: "1.5" },
      { page: "100001" }
    ])
      expect(parseScheduleFilters(params).invalid).toBe(true);
  });
});
