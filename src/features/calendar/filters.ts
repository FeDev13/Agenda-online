import { z } from "zod";

const dateFilter = z.union([z.literal(""), z.iso.date()]);
const schema = z
  .object({
    scope: z.enum(["upcoming", "overdue", "review", "resolved"]),
    page: z
      .union([z.number(), z.string().regex(/^[1-9]\d*$/)])
      .transform(Number)
      .pipe(z.number().int().min(1).max(100000)),
    kind: z.enum(["all", "event", "deadline", "task"]),
    from: dateFilter,
    to: dateFilter
  })
  .refine(({ from, to }) => !from || !to || from <= to);

export function parseScheduleFilters(
  params: Record<string, string | string[] | undefined>
) {
  const parsed = schema.safeParse({
    scope: params.scope ?? "upcoming",
    page: params.page ?? 1,
    kind: params.kind ?? "all",
    from: params.from ?? "",
    to: params.to ?? ""
  });
  return parsed.success
    ? { ...parsed.data, invalid: false }
    : {
        kind: "all" as const,
        scope: "upcoming" as const,
        page: 1,
        from: "",
        to: "",
        invalid: true
      };
}

export function filterSchedule<T extends { kind: string; dateKey: string }>(
  schedule: T[],
  filters: ReturnType<typeof parseScheduleFilters>
) {
  return schedule.filter(
    (entry) =>
      (filters.kind === "all" || entry.kind === filters.kind) &&
      (!filters.from || entry.dateKey >= filters.from) &&
      (!filters.to || entry.dateKey <= filters.to)
  );
}

export type ScheduleFilters = ReturnType<typeof parseScheduleFilters>;

export function agendaHref(
  filters: ScheduleFilters,
  changes: Partial<Pick<ScheduleFilters, "scope" | "page">> = {}
) {
  const next = { ...filters, ...changes };
  const params = new URLSearchParams({ scope: next.scope, kind: next.kind });
  if (next.from) params.set("from", next.from);
  if (next.to) params.set("to", next.to);
  if (next.page > 1) params.set("page", String(next.page));
  return `/app/calendar?${params}`;
}
