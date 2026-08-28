import "server-only";

import { revalidatePath } from "next/cache";

import type { CreateDeadlineInput, CreateEventInput } from "@/features/cases/validation";
import { canManageScheduling } from "@/lib/domain/authorization";
import { requireActiveMembership } from "@/lib/server/auth";
import { UserFacingError } from "@/lib/server/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ScheduleItem = {
  caseId: string;
  caseTitle: string;
  dateLabel: string;
  id: string;
  kind: "deadline" | "event";
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

function getDateOnlyInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export async function listUpcomingSchedule(): Promise<ScheduleItem[]> {
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const today = getDateOnlyInTimeZone(now, defaultDisplayTimeZone);

  const [eventsResult, deadlinesResult] = await Promise.all([
    supabase
      .from("events")
      .select("id,case_id,title,starts_at,timezone,location")
      .eq("firm_id", membership.firmId)
      .gte("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(20),
    supabase
      .from("case_deadlines")
      .select("id,case_id,title,due_on,rule_source")
      .eq("firm_id", membership.firmId)
      .gte("due_on", today)
      .order("due_on", { ascending: true })
      .limit(20)
  ]);

  if (eventsResult.error || deadlinesResult.error) {
    throw new UserFacingError("No se pudo cargar la agenda.");
  }

  const eventRows = (eventsResult.data ?? []) as EventRow[];
  const deadlineRows = (deadlinesResult.data ?? []) as DeadlineRow[];
  const caseIds = [
    ...new Set([
      ...eventRows.map((row) => row.case_id),
      ...deadlineRows.map((row) => row.case_id)
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
      id: row.id,
      kind: "deadline" as const,
      subtitle: row.rule_source,
      title: row.title
    },
    sortKey: `${row.due_on}T00:00:00.000Z`
  }));

  return [...events, ...deadlines]
    .sort((left, right) => left.sortKey.localeCompare(right.sortKey))
    .map(({ item }) => item);
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

export async function createDeadline(input: CreateDeadlineInput) {
  const { membership } = await requireActiveMembership();

  if (!canManageScheduling(membership.role)) {
    throw new UserFacingError("Tu rol no permite crear entradas de agenda.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_legal_deadline", {
    p_calculation_notes: input.calculationNotes,
    p_case_id: input.caseId,
    p_due_on: input.dueOn,
    p_rule_source: input.ruleSource,
    p_title: input.title
  });

  if (error) {
    throw new UserFacingError("No se pudo crear el vencimiento.");
  }

  revalidatePath("/app");
  revalidatePath("/app/calendar");
}
