import { describe, expect, it } from "vitest";
import {
  formatDateOnly,
  formatDueLabel,
  formatFileSize,
  formatFileType,
  formatTimeZone
} from "@/lib/presentation";

describe("date and document presentation", () => {
  it("keeps a date-only value on the same day regardless of local timezone", () => {
    expect(formatDateOnly("2026-10-01")).toMatch(/1 oct/);
  });

  it("describes due dates using the firm's calendar day at a UTC boundary", () => {
    const now = new Date("2026-10-02T01:00:00Z");
    const zone = "America/Argentina/Buenos_Aires";
    expect(formatDueLabel("2026-09-30", now, zone)).toBe("Vencido");
    expect(formatDueLabel("2026-10-01", now, zone)).toBe("Vence hoy");
    expect(formatDueLabel("2026-10-02", now, zone)).toBe("Vence mañana");
    expect(formatDueLabel("2026-10-08", now, zone)).toBe("Vence en 7 días");
    expect(formatDueLabel("2026-10-09", now, zone)).toBeNull();
  });

  it("shows the event timezone offset at the event date", () => {
    expect(
      formatTimeZone("America/Argentina/Buenos_Aires", new Date("2026-10-01T12:00:00Z"))
    ).toBe("Buenos Aires (GMT-3)");
    expect(formatTimeZone("America/New_York", new Date("2026-01-01T12:00:00Z"))).toBe(
      "New York (GMT-5)"
    );
    expect(formatTimeZone("America/New_York", new Date("2026-07-01T12:00:00Z"))).toBe(
      "New York (GMT-4)"
    );
  });

  it("formats unknown, empty, and large files without confusing zero with missing data", () => {
    expect(formatFileSize(null)).toBe("Sin datos");
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1536)).toBe("1,5 KB");
    expect(formatFileSize(1048576)).toBe("1 MB");
    expect(formatFileType("application/pdf")).toBe("PDF");
    expect(formatFileType("application/octet-stream")).toBe("Archivo");
    expect(formatFileType(null)).toBe("Sin datos");
  });
});
