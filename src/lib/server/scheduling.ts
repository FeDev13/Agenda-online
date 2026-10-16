import "server-only";

import { revalidatePath } from "next/cache";

import type {
  CreateEventInput,
  HideScheduleItemInput
} from "@/features/cases/validation";
import { canManageScheduling } from "@/lib/domain/authorization";
import type { ActiveMembership } from "@/lib/domain/authorization";
import { listAgenda } from "@/lib/server/agenda";
import { parseScheduleFilters } from "@/features/calendar/filters";
import {
  addDaysToDateOnly,
  getDateOnlyInTimeZone,
  type DeadlineProximity
} from "@/lib/schedule-proximity";
import { requireActiveMembership } from "@/lib/server/auth";
import { UserFacingError } from "@/lib/server/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ScheduleItem = {
  caseId: string;
  caseTitle: string;
  dateLabel: string;
  deadlineProximity: DeadlineProximity | null;
  id: string;
  kind: "deadline" | "event" | "task";
  subtitle: string | null;
  title: string;
  urgencyLabel: string | null;
  dateKey: string;
};

export async function listUpcomingSchedule(): Promise<ScheduleItem[]> {
  return (await listAgenda(parseScheduleFilters({}))).entries;
}

export async function hasImminentScheduleDeadline(membership: ActiveMembership) {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const { data: firm, error: firmError } = await supabase
    .from("firms")
    .select("default_timezone")
    .eq("id", membership.firmId)
    .single();
  if (firmError || !firm) throw new UserFacingError("No se pudo cargar la agenda.");
  const today = getDateOnlyInTimeZone(now, firm.default_timezone);
  const cutoff = addDaysToDateOnly(today, 2);

  const [deadlinesResult, tasksResult] = await Promise.all([
    supabase
      .from("case_deadlines")
      .select("due_on")
      .eq("firm_id", membership.firmId)
      .in("status", ["pending", "needs_review"])
      .lte("due_on", cutoff)
      .limit(1),
    supabase
      .from("tasks")
      .select("due_on")
      .eq("firm_id", membership.firmId)
      .eq("status", "open")
      .not("due_on", "is", null)
      .lte("due_on", cutoff)
      .limit(1)
  ]);

  if (deadlinesResult.error || tasksResult.error) {
    return false;
  }

  return Boolean(deadlinesResult.data?.length || tasksResult.data?.length);
}

export async function createEvent(input: CreateEventInput) {
  const { membership } = await requireActiveMembership();

  if (!canManageScheduling(membership.role)) {
    throw new UserFacingError("Tu rol no permite crear entradas de agenda.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_case_event", {
    p_case_id: input.caseId,
    p_description: input.description,
    p_ends_at_local: input.endsAtLocal,
    p_location: input.location,
    p_starts_at_local: input.startsAtLocal,
    p_timezone: input.timezone,
    p_title: input.title
  });

  if (error) {
    throw new UserFacingError("No se pudo crear el evento.");
  }

  revalidatePath("/app");
  revalidatePath("/app/calendar");
}

export async function hideScheduleItem(input: HideScheduleItemInput) {
  const { membership } = await requireActiveMembership();

  if (!canManageScheduling(membership.role)) {
    throw new UserFacingError("Tu rol no permite ocultar entradas de agenda.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("hide_schedule_item", {
    p_item_id: input.id,
    p_item_kind: input.kind
  });

  if (error) {
    throw new UserFacingError("No se pudo ocultar el ítem de agenda.");
  }

  revalidatePath("/app");
  revalidatePath("/app/calendar");
}
