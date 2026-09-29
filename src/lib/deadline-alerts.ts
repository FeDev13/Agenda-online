import { addDaysToDateOnly, getDateOnlyInTimeZone } from "@/lib/schedule-proximity";
import type {
  FirmRole,
  NotificationAlertWindow,
  NotificationScheduleItemKind
} from "@/types/database";

export type DeadlineAlertScheduleItem = {
  caseId: string;
  dueOn: string;
  firmId: string;
  id: string;
  kind: NotificationScheduleItemKind;
};

export type DeadlineAlertRecipient = {
  displayName: string | null;
  email: string;
  profileId: string;
  role: FirmRole;
};

export type DeadlineAlertEmail = {
  html: string;
  subject: string;
  text: string;
};

const alertWindows: Array<{
  daysUntil: number;
  window: NotificationAlertWindow;
}> = [
  { daysUntil: 7, window: "seven_day" },
  { daysUntil: 2, window: "forty_eight_hour" },
  { daysUntil: 1, window: "twenty_four_hour" },
  { daysUntil: 0, window: "twenty_four_hour" }
];

const alertWindowLabels: Record<NotificationAlertWindow, string> = {
  forty_eight_hour: "menos de 48 horas",
  seven_day: "7 dias",
  twenty_four_hour: "menos de 24 horas"
};

export function getDeadlineAlertTargetDates(now: Date, timeZone: string) {
  const today = getDateOnlyInTimeZone(now, timeZone);

  return alertWindows.map(({ daysUntil, window }) => ({
    dueOn: addDaysToDateOnly(today, daysUntil),
    window
  }));
}

export function getDeadlineAlertWindow(dueOn: string, now: Date, timeZone: string) {
  const target = getDeadlineAlertTargetDates(now, timeZone).find(
    (candidate) => candidate.dueOn === dueOn
  );

  return target?.window ?? null;
}

export function getAuthorizedDeadlineAlertRecipients({
  caseMemberProfileIds,
  recipients
}: {
  caseMemberProfileIds: Set<string>;
  recipients: DeadlineAlertRecipient[];
}) {
  return recipients.filter((recipient) => {
    if (!recipient.email.includes("@")) {
      return false;
    }

    return (
      recipient.role === "admin" ||
      recipient.role === "lawyer" ||
      caseMemberProfileIds.has(recipient.profileId)
    );
  });
}

export function buildDeadlineAlertEmail({
  appBaseUrl,
  appName = "Agenda Legal",
  dueOn,
  window
}: {
  appBaseUrl: string;
  appName?: string;
  dueOn: string;
  window: NotificationAlertWindow;
}): DeadlineAlertEmail {
  const calendarUrl = new URL("/app/calendar", appBaseUrl).toString();
  const windowLabel = alertWindowLabels[window];
  const subject = `${appName}: vencimiento proximo`;
  const text = [
    `Hay un vencimiento proximo en ${appName}.`,
    "",
    `Fecha de vencimiento: ${dueOn}`,
    `Aviso: ${windowLabel}`,
    "",
    `Ingresa para revisar los detalles: ${calendarUrl}`,
    "",
    "Por confidencialidad, este correo no incluye datos de la causa."
  ].join("\n");
  const html = [
    `<p>Hay un vencimiento proximo en ${escapeHtml(appName)}.</p>`,
    `<p><strong>Fecha de vencimiento:</strong> ${escapeHtml(dueOn)}<br /><strong>Aviso:</strong> ${escapeHtml(windowLabel)}</p>`,
    `<p><a href="${escapeHtml(calendarUrl)}">Ingresar a la agenda</a></p>`,
    "<p>Por confidencialidad, este correo no incluye datos de la causa.</p>"
  ].join("");

  return { html, subject, text };
}

export function buildDeadlineAlertIdempotencyKey({
  recipientProfileId,
  scheduleItemId,
  scheduleItemKind,
  window
}: {
  recipientProfileId: string;
  scheduleItemId: string;
  scheduleItemKind: NotificationScheduleItemKind;
  window: NotificationAlertWindow;
}) {
  return [
    "deadline-alert",
    recipientProfileId,
    scheduleItemKind,
    scheduleItemId,
    window
  ].join(":");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
