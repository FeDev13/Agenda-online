import { describe, expect, it } from "vitest";

import {
  addDaysToDateOnly,
  getDeadlineProximity,
  isDeadlineWithin48Hours
} from "@/lib/schedule-proximity";

const timeZone = "America/Argentina/Buenos_Aires";
const now = new Date("2026-09-28T15:00:00.000Z");

describe("deadline proximity", () => {
  it("marks today and tomorrow as urgent", () => {
    expect(getDeadlineProximity("2026-09-28", now, timeZone)).toBe("urgent");
    expect(getDeadlineProximity("2026-09-29", now, timeZone)).toBe("urgent");
  });

  it("marks due dates within the next week as soon", () => {
    expect(getDeadlineProximity("2026-10-05", now, timeZone)).toBe("soon");
  });

  it("marks due dates more than one week away as normal", () => {
    expect(getDeadlineProximity("2026-10-06", now, timeZone)).toBe("normal");
  });

  it("uses a date-only 48 hour window for sidebar warnings", () => {
    expect(isDeadlineWithin48Hours("2026-09-30", now, timeZone)).toBe(true);
    expect(isDeadlineWithin48Hours("2026-10-01", now, timeZone)).toBe(false);
  });

  it("adds days without converting date-only values through local time", () => {
    expect(addDaysToDateOnly("2026-09-28", 2)).toBe("2026-09-30");
  });
});
