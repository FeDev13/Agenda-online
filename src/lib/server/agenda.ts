import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ScheduleFilters } from "@/features/calendar/filters";
import {
  createDeadlineSchema,
  updateDeadlineStatusSchema
} from "@/features/calendar/deadline-validation";
import { canManageScheduling } from "@/lib/domain/authorization";
import { formatDateOnly, formatDueLabel, formatTimeZone } from "@/lib/presentation";
import { getDeadlineProximity } from "@/lib/schedule-proximity";
import { requireActiveMembership } from "@/lib/server/auth";
import { UserFacingError } from "@/lib/server/errors";
import type { ScheduleItem } from "@/lib/server/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const entrySchema = z.object({
  id: z.uuid(),
  case_id: z.uuid(),
  case_title: z.string(),
  title: z.string(),
  kind: z.enum(["event", "deadline", "task"]),
  date_key: z.iso.date(),
  starts_at: z.string().nullable(),
  timezone: z.string().nullable(),
  subtitle: z.string().nullable(),
  status: z.enum(["pending", "needs_review", "completed", "cancelled", "open"]),
  status_revision: z.number().int(),
  status_changed_at: z.string().nullable()
});
const responseSchema = z.object({
  total: z.number().int().nonnegative(),
  timezone: z.string(),
  today: z.iso.date(),
  entries: z.array(entrySchema)
});
export type AgendaEntry = ScheduleItem & {
  status: z.infer<typeof entrySchema>["status"];
  statusRevision: number;
  statusChangedAt: string | null;
};

export async function listAgenda(filters: ScheduleFilters) {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("list_agenda", {
    p_firm_id: membership.firmId,
    p_scope: filters.scope,
    p_kind: filters.kind,
    p_from: filters.from || null,
    p_to: filters.to || null,
    p_page: filters.page
  });
  const parsed = responseSchema.safeParse(data);
  if (error || !parsed.success) throw new UserFacingError("No se pudo cargar la agenda.");
  const { total, timezone: timeZone, today } = parsed.data;
  const now = new Date();
  const entries: AgendaEntry[] = parsed.data.entries.map((entry) => {
    const pending = entry.status === "pending" || entry.status === "open";
    const dateLabel =
      entry.kind === "event" && entry.starts_at && entry.timezone
        ? `${new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short", timeZone: entry.timezone }).format(new Date(entry.starts_at))} · ${formatTimeZone(entry.timezone, new Date(entry.starts_at))}`
        : formatDateOnly(entry.date_key);
    return {
      id: entry.id,
      caseId: entry.case_id,
      caseTitle: entry.case_title,
      title: entry.title,
      subtitle: entry.subtitle,
      kind: entry.kind,
      dateKey: entry.date_key,
      dateLabel,
      status: entry.status,
      statusRevision: entry.status_revision,
      statusChangedAt: entry.status_changed_at,
      deadlineProximity:
        entry.kind !== "event" && pending
          ? getDeadlineProximity(entry.date_key, now, timeZone)
          : null,
      urgencyLabel:
        entry.kind !== "event" && pending
          ? formatDueLabel(entry.date_key, now, timeZone)
          : null
    };
  });
  return { entries, total, pageSize: 25, timeZone, today };
}

export async function createDeadline(input: z.infer<typeof createDeadlineSchema>) {
  const validated = createDeadlineSchema.parse(input);
  const { membership } = await requireActiveMembership();
  if (!canManageScheduling(membership.role))
    throw new UserFacingError("Tu rol no permite crear vencimientos.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_legal_deadline", {
    p_case_id: validated.caseId,
    p_title: validated.title,
    p_due_on: validated.dueOn,
    p_rule_source: validated.ruleSource
  });
  if (error) throw new UserFacingError("No se pudo crear el vencimiento.");
  revalidatePath("/app", "layout");
}

export async function updateDeadlineStatus(
  input: z.infer<typeof updateDeadlineStatusSchema>
) {
  const validated = updateDeadlineStatusSchema.parse(input);
  const { membership } = await requireActiveMembership();
  if (!canManageScheduling(membership.role))
    throw new UserFacingError("Tu rol no permite actualizar vencimientos.");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_deadline_status", {
    p_deadline_id: validated.deadlineId,
    p_status: validated.status,
    p_expected_revision: validated.expectedRevision
  });
  if (error?.code === "40001")
    throw new UserFacingError(
      "Otra persona actualizó este vencimiento. Recargá la página y revisá su estado antes de continuar."
    );
  if (error) throw new UserFacingError("No se pudo actualizar el vencimiento.");
  revalidatePath("/app", "layout");
}
