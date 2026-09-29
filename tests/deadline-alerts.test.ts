import { describe, expect, it } from "vitest";

import {
  buildDeadlineAlertEmail,
  buildDeadlineAlertIdempotencyKey,
  getAuthorizedDeadlineAlertRecipients,
  getDeadlineAlertTargetDates,
  getDeadlineAlertWindow,
  type DeadlineAlertRecipient
} from "@/lib/deadline-alerts";

const now = new Date("2026-09-28T15:00:00.000Z");
const timeZone = "America/Argentina/Buenos_Aires";

describe("deadline email alerts", () => {
  it("builds date-only alert windows in the firm timezone", () => {
    expect(getDeadlineAlertTargetDates(now, timeZone)).toEqual([
      { dueOn: "2026-10-05", window: "seven_day" },
      { dueOn: "2026-09-30", window: "forty_eight_hour" },
      { dueOn: "2026-09-29", window: "twenty_four_hour" },
      { dueOn: "2026-09-28", window: "twenty_four_hour" }
    ]);

    expect(getDeadlineAlertWindow("2026-10-05", now, timeZone)).toBe("seven_day");
    expect(getDeadlineAlertWindow("2026-09-30", now, timeZone)).toBe("forty_eight_hour");
    expect(getDeadlineAlertWindow("2026-09-29", now, timeZone)).toBe("twenty_four_hour");
    expect(getDeadlineAlertWindow("2026-10-01", now, timeZone)).toBeNull();
  });

  it("targets firm-wide roles and assigned case members only", () => {
    const recipients: DeadlineAlertRecipient[] = [
      {
        displayName: "Admin",
        email: "admin@example.test",
        profileId: "admin",
        role: "admin"
      },
      {
        displayName: "Lawyer",
        email: "lawyer@example.test",
        profileId: "lawyer",
        role: "lawyer"
      },
      {
        displayName: "Assigned reader",
        email: "reader@example.test",
        profileId: "reader",
        role: "read_only"
      },
      {
        displayName: "Unassigned paralegal",
        email: "paralegal@example.test",
        profileId: "paralegal",
        role: "paralegal"
      }
    ];

    expect(
      getAuthorizedDeadlineAlertRecipients({
        caseMemberProfileIds: new Set(["reader"]),
        recipients
      }).map((recipient) => recipient.profileId)
    ).toEqual(["admin", "lawyer", "reader"]);
  });

  it("builds privacy-preserving email copy", () => {
    const email = buildDeadlineAlertEmail({
      appBaseUrl: "https://agenda.example.test",
      dueOn: "2026-09-30",
      window: "forty_eight_hour"
    });

    expect(email.subject).toBe("Agenda Legal: vencimiento proximo");
    expect(email.text).toContain("Fecha de vencimiento: 2026-09-30");
    expect(email.text).toContain("no incluye datos de la causa");
    expect(email.text).toContain("https://agenda.example.test/app/calendar");
    expect(email.text).not.toContain("cliente");
  });

  it("builds stable idempotency keys", () => {
    expect(
      buildDeadlineAlertIdempotencyKey({
        recipientProfileId: "profile-1",
        scheduleItemId: "item-1",
        scheduleItemKind: "deadline",
        window: "seven_day"
      })
    ).toBe("deadline-alert:profile-1:deadline:item-1:seven_day");
  });
});
