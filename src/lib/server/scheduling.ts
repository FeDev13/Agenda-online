import "server-only";

import { revalidatePath } from "next/cache";

import type {
  CreateEventInput,
  HideScheduleItemInput
} from "@/features/cases/validation";
import { canManageScheduling } from "@/lib/domain/authorization";
import type { ActiveMembership } from "@/lib/domain/authorization";
import {
  addDaysToDateOnly,
  getDateOnlyInTimeZone,
  getDeadlineProximity,
  isDeadlineWithin48Hours,
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
};

type EventRow = {
  case_id: string;
  id: string;
  location: string | null;
  starts_at: string;
  timezone: string;
  title: string;
};

type TaskRow = {
  case_id: string;
  due_on: string;
  id: string;
  title: string;
};

type DeadlineRow = {
  case_id: string;
  due_on: string;
  id: string;
  rule_source: string | null;
  title: string;
};

type CaseTitleRow = {
  id: string;
  title: string;
};

const defaultDisplayTimeZone =
  process.env.DEFAULT_FIRM_TIMEZONE ?? "America/Argentina/Buenos_Aires";

export async function listUpcomingSchedule(): Promise<ScheduleItem[]> {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const today = getDateOnlyInTimeZone(now, defaultDisplayTimeZone);

  const [eventsResult, deadlinesResult, tasksResult] = await Promise.all([
    supabase
      .from("events")
      .select("id,case_id,title,starts_at,timezone,location")
      .eq("firm_id", membership.firmId)
      .is("hidden_at", null)
      .gte("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(20),
    supabase
      .from("case_deadlines")
      .select("id,case_id,title,due_on,rule_source")
      .eq("firm_id", membership.firmId)
      .is("hidden_at", null)
      .gte("due_on", today)
      .order("due_on", { ascending: true })
      .limit(20),
    supabase
      .from("tasks")
      .select("id,case_id,title,due_on")
      .eq("firm_id", membership.firmId)
      .eq("status", "open")
      .not("due_on", "is", null)
      .gte("due_on", today)
      .order("due_on", { ascending: true })
      .limit(20)
  ]);

  if (eventsResult.error || deadlinesResult.error || tasksResult.error) {
    throw new UserFacingError("No se pudo cargar la agenda.");
  }

  const eventRows = (eventsResult.data ?? []) as EventRow[];
  const deadlineRows = (deadlinesResult.data ?? []) as DeadlineRow[];
  const taskRows = (tasksResult.data ?? []) as TaskRow[];
  const caseIds = [
    ...new Set([
      ...eventRows.map((row) => row.case_id),
      ...deadlineRows.map((row) => row.case_id),
      ...taskRows.map((row) => row.case_id)
    ])
  ];

  const { data: cases, error: casesError } = caseIds.length
    ? await supabase
        .from("cases")
        .select("id,title")
        .eq("firm_id", membership.firmId)
        .in("id", caseIds)
    : { data: [], error: null };

  if (casesError) {
    throw new UserFacingError("No se pudo cargar la agenda.");
  }

  const caseTitles = new Map(
    ((cases ?? []) as CaseTitleRow[]).map((caseItem) => [caseItem.id, caseItem.title])
  );

  const events = eventRows.map((row) => ({
    item: {
      caseId: row.case_id,
      caseTitle: caseTitles.get(row.case_id) ?? "Causa",
      dateLabel: new Intl.DateTimeFormat("es-AR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: row.timezone
      }).format(new Date(row.starts_at)),
      deadlineProximity: null,
      id: row.id,
      kind: "event" as const,
      subtitle: row.location,
      title: row.title
    },
    sortKey: row.starts_at
  }));

  const deadlines = deadlineRows.map((row) => ({
    item: {
      caseId: row.case_id,
      caseTitle: caseTitles.get(row.case_id) ?? "Causa",
      dateLabel: row.due_on,
      deadlineProximity: getDeadlineProximity(row.due_on, now, defaultDisplayTimeZone),
      id: row.id,
      kind: "deadline" as const,
      subtitle: row.rule_source,
      title: row.title
    },
    sortKey: `${row.due_on}T00:00:00.000Z`
  }));

  const tasks = taskRows.map((row) => ({
    item: {
      caseId: row.case_id,
      caseTitle: caseTitles.get(row.case_id) ?? "Causa",
      dateLabel: row.due_on,
      deadlineProximity: getDeadlineProximity(row.due_on, now, defaultDisplayTimeZone),
      id: row.id,
      kind: "task" as const,
      subtitle: "Tarea pendiente",
      title: row.title
    },
    sortKey: `${row.due_on}T00:00:00.000Z`
  }));

  return [...events, ...deadlines, ...tasks]
    .sort((left, right) => left.sortKey.localeCompare(right.sortKey))
    .map(({ item }) => item);
}

export async function hasImminentScheduleDeadline(membership: ActiveMembership) {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const today = getDateOnlyInTimeZone(now, defaultDisplayTimeZone);
  const cutoff = addDaysToDateOnly(today, 2);

  const [deadlinesResult, tasksResult] = await Promise.all([
    supabase
      .from("case_deadlines")
      .select("due_on")
      .eq("firm_id", membership.firmId)
      .is("hidden_at", null)
      .gte("due_on", today)
      .lte("due_on", cutoff)
      .limit(1),
    supabase
      .from("tasks")
      .select("due_on")
      .eq("firm_id", membership.firmId)
      .eq("status", "open")
      .not("due_on", "is", null)
      .gte("due_on", today)
      .lte("due_on", cutoff)
      .limit(1)
  ]);

  if (deadlinesResult.error || tasksResult.error) {
    return false;
  }

  return [...(deadlinesResult.data ?? []), ...(tasksResult.data ?? [])].some(
    (row) =>
      row.due_on !== null &&
      isDeadlineWithin48Hours(row.due_on, now, defaultDisplayTimeZone)
  );
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
