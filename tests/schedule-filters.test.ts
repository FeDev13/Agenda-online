import { describe, expect, it } from "vitest";
import { filterSchedule, parseScheduleFilters } from "@/features/calendar/filters";

describe("agenda filters", () => {
  const schedule = [
    { kind: "event", dateKey: "2026-10-01" },
    { kind: "task", dateKey: "2026-10-02" },
    { kind: "deadline", dateKey: "2026-10-03" }
  ];

  it("combines type and inclusive date boundaries", () => {
    expect(
      filterSchedule(
        schedule,
        parseScheduleFilters({ from: "2026-10-02", to: "2026-10-03" })
      )
    ).toEqual(schedule.slice(1));
    expect(
      filterSchedule(
        schedule,
        parseScheduleFilters({ kind: "task", from: "2026-10-02", to: "2026-10-02" })
      )
    ).toEqual([schedule[1]]);
    expect(
      filterSchedule(
        schedule,
        parseScheduleFilters({ kind: "event", from: "2026-10-02" })
      )
    ).toEqual([]);
  });

  it("rejects impossible, reversed, repeated, or unsupported filters", () => {
    for (const params of [
      { from: "2026-02-30" },
      { from: "2026-10-03", to: "2026-10-01" },
      { kind: "unknown" },
      { kind: ["task", "event"] }
    ]) {
      expect(parseScheduleFilters(params).invalid).toBe(true);
    }
    expect(parseScheduleFilters({}).invalid).toBe(false);
  });
});
