import { getDateOnlyDaysUntil } from "@/lib/schedule-proximity";

export function formatDateOnly(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatDueLabel(dueOn: string, now: Date, timeZone: string) {
  const days = getDateOnlyDaysUntil(dueOn, now, timeZone);
  if (days < 0) return "Vencido";
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  if (days <= 7) return `Vence en ${days} días`;
  return null;
}

export function formatTimeZone(timeZone: string, at: Date) {
  const city = timeZone.split("/").at(-1)?.replaceAll("_", " ") ?? timeZone;
  const offset = new Intl.DateTimeFormat("es-AR", {
    timeZone,
    timeZoneName: "shortOffset"
  })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value;
  return `${city} (${offset})`;
}

export function formatFileSize(bytes: number | null) {
  if (bytes === null) return "Sin datos";
  if (bytes < 1024) return `${bytes} B`;
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 }).format(bytes / (bytes < 1024 * 1024 ? 1024 : 1024 * 1024))} ${bytes < 1024 * 1024 ? "KB" : "MB"}`;
}

export function formatFileType(mimeType: string | null) {
  const types: Record<string, string> = {
    "application/pdf": "PDF",
    "image/png": "Imagen PNG",
    "image/jpeg": "Imagen JPEG",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "Documento Word"
  };
  return mimeType ? (types[mimeType] ?? "Archivo") : "Sin datos";
}
