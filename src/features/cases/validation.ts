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
  .regex(dateOnlyPattern, "Use YYYY-MM-DD.")
  .refine(isRealDateOnly, "Use a real calendar date.");

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
  .regex(localDateTimePattern, "Use a local date and time.")
  .refine(isRealLocalDateTime, "Use a real local date and time.");

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
  .min(1, "Timezone is required.")
  .max(80)
  .refine(isSupportedTimeZone, "Use a supported IANA timezone.");

export const createCaseSchema = z.object({
  caseNumber: z.string().trim().min(1, "Case number is required.").max(80),
  clientName: z.string().trim().min(1, "Client name is required.").max(180),
  court: optionalTrimmedString,
  description: optionalTrimmedString,
  docketNumber: optionalTrimmedString,
  jurisdiction: optionalTrimmedString,
  openedOn: dateOnlySchema,
  title: z.string().trim().min(1, "Case title is required.").max(200)
});

export const createEventSchema = z
  .object({
    caseId: z.string().uuid("Select a case."),
    description: optionalTrimmedString,
    endsAtLocal: optionalLocalDateTimeSchema,
    location: optionalTrimmedString,
    startsAtLocal: localDateTimeSchema,
    timezone: timezoneSchema.default("America/Argentina/Buenos_Aires"),
    title: z.string().trim().min(1, "Event title is required.").max(200)
  })
  .refine(
    (value) =>
      !value.endsAtLocal ||
      new Date(value.endsAtLocal).getTime() >= new Date(value.startsAtLocal).getTime(),
    {
      message: "End time must be after the start time.",
      path: ["endsAtLocal"]
    }
  );

export const createDeadlineSchema = z.object({
  calculationNotes: optionalTrimmedString,
  caseId: z.string().uuid("Select a case."),
  dueOn: dateOnlySchema,
  ruleSource: optionalTrimmedString,
  title: z.string().trim().min(1, "Deadline title is required.").max(200)
});

export const createNoteSchema = z.object({
  body: z.string().trim().min(1, "Note body is required.").max(4000),
  caseId: z.string().uuid("Select a case.")
});

export const createTaskSchema = z.object({
  assignedTo: optionalUuidSchema,
  caseId: z.string().uuid("Select a case."),
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
  title: z.string().trim().min(1, "Task title is required.").max(220)
});

export const createDocumentMetadataSchema = z.object({
  caseId: z.string().uuid("Select a case."),
  displayName: z.string().trim().min(1, "Document name is required.").max(220),
  mimeType: optionalTrimmedString,
  sizeBytes: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : Number(value)))
    .pipe(
      z
        .number({ error: "Size must be a number." })
        .int("Size must be a whole number.")
        .min(0, "Size cannot be negative.")
        .max(52_428_800, "Size cannot exceed 50 MiB.")
        .nullable()
    )
});

export const createDocumentUploadSchema = z.object({
  caseId: z.string().uuid("Select a case."),
  displayName: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .pipe(z.string().max(220, "Document name is too long.").nullable())
});

export const archiveNoteSchema = z.object({
  caseId: z.string().uuid("Select a case."),
  noteId: z.string().uuid("Select a note.")
});

export const updateTaskStatusSchema = z.object({
  caseId: z.string().uuid("Select a case."),
  status: z.enum(["open", "completed", "archived"]),
  taskId: z.string().uuid("Select a task.")
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type CreateDeadlineInput = z.infer<typeof createDeadlineSchema>;
export type CreateDocumentMetadataInput = z.infer<typeof createDocumentMetadataSchema>;
export type CreateDocumentUploadInput = z.infer<typeof createDocumentUploadSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type ArchiveNoteInput = z.infer<typeof archiveNoteSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
