import { describe, expect, it } from "vitest";

import {
  archiveNoteSchema,
  createDeadlineSchema,
  createDocumentMetadataSchema,
  createDocumentUploadSchema,
  createEventSchema,
  createNoteSchema,
  createTaskSchema,
  dateOnlySchema,
  updateTaskStatusSchema
} from "@/features/cases/validation";

describe("case and scheduling validation", () => {
  it("accepts legal deadlines as date-only values", () => {
    const parsed = createDeadlineSchema.parse({
      calculationNotes: "",
      caseId: "10000000-0000-4000-8000-000000000001",
      dueOn: "2026-09-15",
      ruleSource: "Manual court order review",
      title: "Respond to motion"
    });

    expect(parsed.dueOn).toBe("2026-09-15");
    expect(parsed.calculationNotes).toBeNull();
  });

  it("rejects impossible date-only values", () => {
    expect(dateOnlySchema.safeParse("2026-02-31").success).toBe(false);
  });

  it("preserves timezone-aware event input for PostgreSQL conversion", () => {
    const parsed = createEventSchema.parse({
      caseId: "10000000-0000-4000-8000-000000000001",
      description: "",
      endsAtLocal: "2026-09-15T11:00",
      location: "Courtroom 4",
      startsAtLocal: "2026-09-15T10:00",
      timezone: "America/Argentina/Buenos_Aires",
      title: "Hearing"
    });

    expect(parsed.startsAtLocal).toBe("2026-09-15T10:00");
    expect(parsed.timezone).toBe("America/Argentina/Buenos_Aires");
  });

  it("accepts a missing optional event end time", () => {
    const parsed = createEventSchema.parse({
      caseId: "10000000-0000-4000-8000-000000000001",
      description: "",
      endsAtLocal: null,
      location: "",
      startsAtLocal: "2026-09-15T10:00",
      timezone: "America/Argentina/Buenos_Aires",
      title: "Hearing"
    });

    expect(parsed.endsAtLocal).toBeNull();
  });

  it("rejects impossible local event times and unsupported timezones", () => {
    const impossibleLocalTime = createEventSchema.safeParse({
      caseId: "10000000-0000-4000-8000-000000000001",
      description: "",
      endsAtLocal: "",
      location: "",
      startsAtLocal: "2026-02-31T10:00",
      timezone: "America/Argentina/Buenos_Aires",
      title: "Hearing"
    });

    const unsupportedTimezone = createEventSchema.safeParse({
      caseId: "10000000-0000-4000-8000-000000000001",
      description: "",
      endsAtLocal: "",
      location: "",
      startsAtLocal: "2026-09-15T10:00",
      timezone: "Buenos Aires",
      title: "Hearing"
    });

    expect(impossibleLocalTime.success).toBe(false);
    expect(unsupportedTimezone.success).toBe(false);
  });

  it("rejects event end times before start times", () => {
    const parsed = createEventSchema.safeParse({
      caseId: "10000000-0000-4000-8000-000000000001",
      description: "",
      endsAtLocal: "2026-09-15T09:00",
      location: "",
      startsAtLocal: "2026-09-15T10:00",
      timezone: "America/Argentina/Buenos_Aires",
      title: "Hearing"
    });

    expect(parsed.success).toBe(false);
  });

  it("validates case notes, tasks, and document metadata", () => {
    expect(
      createNoteSchema.parse({
        body: "Reviewed synthetic court notice.",
        caseId: "10000000-0000-4000-8000-000000000001"
      }).body
    ).toBe("Reviewed synthetic court notice.");

    expect(
      createTaskSchema.parse({
        assignedTo: "",
        caseId: "10000000-0000-4000-8000-000000000001",
        dueOn: "",
        title: "Prepare filing checklist"
      })
    ).toMatchObject({ assignedTo: null, dueOn: null });

    expect(
      createDocumentMetadataSchema.parse({
        caseId: "10000000-0000-4000-8000-000000000001",
        displayName: "Synthetic filing.pdf",
        mimeType: "application/pdf",
        sizeBytes: "1024"
      }).sizeBytes
    ).toBe(1024);
  });

  it("rejects invalid document metadata sizes", () => {
    expect(
      createDocumentMetadataSchema.safeParse({
        caseId: "10000000-0000-4000-8000-000000000001",
        displayName: "Oversized.pdf",
        mimeType: "application/pdf",
        sizeBytes: "52428801"
      }).success
    ).toBe(false);
  });

  it("validates document upload metadata without requiring a separate metadata-only form", () => {
    const parsed = createDocumentUploadSchema.parse({
      caseId: "10000000-0000-4000-8000-000000000001",
      displayName: ""
    });

    expect(parsed.displayName).toBeNull();
    expect(
      createDocumentUploadSchema.safeParse({
        caseId: "10000000-0000-4000-8000-000000000001",
        displayName: "x".repeat(221)
      }).success
    ).toBe(false);
  });

  it("validates note archival and task status transitions", () => {
    expect(
      archiveNoteSchema.parse({
        caseId: "10000000-0000-4000-8000-000000000001",
        noteId: "10000000-0000-4000-8000-000000000501"
      }).noteId
    ).toBe("10000000-0000-4000-8000-000000000501");

    expect(
      updateTaskStatusSchema.parse({
        caseId: "10000000-0000-4000-8000-000000000001",
        status: "completed",
        taskId: "10000000-0000-4000-8000-000000000601"
      }).status
    ).toBe("completed");

    expect(
      updateTaskStatusSchema.safeParse({
        caseId: "10000000-0000-4000-8000-000000000001",
        status: "deleted",
        taskId: "10000000-0000-4000-8000-000000000601"
      }).success
    ).toBe(false);
  });
});
