import { z } from "zod";

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const localDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function isRealDateOnly(value: string) {
  const match = dateOnlyPattern.exec(value);

  if (!match) {
    return false;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isRealLocalDateTime(value: string) {
  const match = localDateTimePattern.exec(value);

  if (!match) {
    return false;
  }

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (hour > 23 || minute > 59) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute
  );
}

function isSupportedTimeZone(value: string) {
  try {
    Intl.DateTimeFormat("en", { timeZone: value }).format(
      new Date("2026-01-01T00:00:00Z")
    );
    return true;
  } catch {
    return false;
  }
}

export const dateOnlySchema = z
  .string()
  .regex(dateOnlyPattern, "Usá el formato AAAA-MM-DD.")
  .refine(isRealDateOnly, "Usá una fecha real del calendario.");

const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable();

const optionalUuidSchema = z
  .union([z.string(), z.null()])
  .transform((value) => {
    if (value === null) {
      return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length === 0 ? null : trimmedValue;
  })
  .pipe(z.string().uuid().nullable());

const localDateTimeSchema = z
  .string()
  .trim()
  .regex(localDateTimePattern, "Usá una fecha y hora local.")
  .refine(isRealLocalDateTime, "Usá una fecha y hora local real.");

const optionalLocalDateTimeSchema = z
  .union([z.string(), z.null()])
  .transform((value) => {
    if (value === null) {
      return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length === 0 ? null : trimmedValue;
  })
  .pipe(localDateTimeSchema.nullable());

const timezoneSchema = z
  .string()
  .trim()
  .min(1, "La zona horaria es obligatoria.")
  .max(80)
  .refine(isSupportedTimeZone, "Usá una zona horaria IANA válida.");

export const createCaseSchema = z.object({
  caseNumber: z.string().trim().min(1, "El número de causa es obligatorio.").max(80),
  clientName: z.string().trim().min(1, "El nombre del cliente es obligatorio.").max(180),
  court: optionalTrimmedString,
  description: optionalTrimmedString,
  docketNumber: optionalTrimmedString,
  jurisdiction: optionalTrimmedString,
  openedOn: dateOnlySchema,
  title: z.string().trim().min(1, "El título de la causa es obligatorio.").max(200)
});

export const archiveCaseSchema = z.object({
  caseId: z.string().uuid("Seleccioná una causa.")
});

export const createEventSchema = z
  .object({
    caseId: z.string().uuid("Seleccioná una causa."),
    description: optionalTrimmedString,
    endsAtLocal: optionalLocalDateTimeSchema,
    location: optionalTrimmedString,
    startsAtLocal: localDateTimeSchema,
    timezone: timezoneSchema.default("America/Argentina/Buenos_Aires"),
    title: z.string().trim().min(1, "El título del evento es obligatorio.").max(200)
  })
  .refine(
    (value) =>
      !value.endsAtLocal ||
      new Date(value.endsAtLocal).getTime() >= new Date(value.startsAtLocal).getTime(),
    {
      message: "La hora de finalización debe ser posterior al inicio.",
      path: ["endsAtLocal"]
    }
  );

export const hideScheduleItemSchema = z.object({
  id: z.string().uuid("Seleccioná un ítem de agenda."),
  kind: z.enum(["deadline", "event"])
});

export const createNoteSchema = z.object({
  body: z.string().trim().min(1, "El texto de la nota es obligatorio.").max(4000),
  caseId: z.string().uuid("Seleccioná una causa.")
});

export const createTaskSchema = z.object({
  assignedTo: optionalUuidSchema,
  caseId: z.string().uuid("Seleccioná una causa."),
  dueOn: z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (value === null) {
        return null;
      }

      const trimmedValue = value.trim();
      return trimmedValue.length === 0 ? null : trimmedValue;
    })
    .pipe(dateOnlySchema.nullable()),
  title: z.string().trim().min(1, "El título de la tarea es obligatorio.").max(220)
});

export const createDocumentMetadataSchema = z.object({
  caseId: z.string().uuid("Seleccioná una causa."),
  displayName: z
    .string()
    .trim()
    .min(1, "El nombre del documento es obligatorio.")
    .max(220),
  mimeType: optionalTrimmedString,
  sizeBytes: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : Number(value)))
    .pipe(
      z
        .number({ error: "El tamaño debe ser un número." })
        .int("El tamaño debe ser un número entero.")
        .min(0, "El tamaño no puede ser negativo.")
        .max(52_428_800, "El tamaño no puede superar 50 MiB.")
        .nullable()
    )
});

export const createDocumentUploadSchema = z.object({
  caseId: z.string().uuid("Seleccioná una causa."),
  displayName: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .pipe(z.string().max(220, "El nombre del documento es demasiado largo.").nullable())
});

export const archiveNoteSchema = z.object({
  caseId: z.string().uuid("Seleccioná una causa."),
  noteId: z.string().uuid("Seleccioná una nota.")
});

export const updateTaskStatusSchema = z.object({
  caseId: z.string().uuid("Seleccioná una causa."),
  status: z.enum(["open", "completed", "archived"]),
  taskId: z.string().uuid("Seleccioná una tarea.")
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type CreateDocumentMetadataInput = z.infer<typeof createDocumentMetadataSchema>;
export type CreateDocumentUploadInput = z.infer<typeof createDocumentUploadSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type HideScheduleItemInput = z.infer<typeof hideScheduleItemSchema>;
export type ArchiveNoteInput = z.infer<typeof archiveNoteSchema>;
export type ArchiveCaseInput = z.infer<typeof archiveCaseSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
