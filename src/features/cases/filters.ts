export const CASE_COURT_FILTER_OPTIONS = [
  { label: "Federal", value: "federal" },
  { label: "Civil y comercial", value: "civil-comercial" },
  { label: "Laboral", value: "laboral" },
  { label: "Familia", value: "familia" }
] as const;

export type CaseCourtFilter = (typeof CASE_COURT_FILTER_OPTIONS)[number]["value"];

export type CaseFilterableSummary = {
  caseNumber: string;
  clientName: string;
  court: string | null;
  docketNumber: string | null;
  title: string;
};

export type CaseListFilters = {
  court?: CaseCourtFilter | null;
  search?: string | null;
};

export function normalizeCaseCourtFilter(
  value: string | string[] | null | undefined
): CaseCourtFilter | null {
  const firstValue = Array.isArray(value) ? value[0] : value;

  if (!firstValue) {
    return null;
  }

  return CASE_COURT_FILTER_OPTIONS.some((option) => option.value === firstValue)
    ? (firstValue as CaseCourtFilter)
    : null;
}

export function normalizeCaseSearchQuery(
  value: string | string[] | null | undefined
): string {
  const firstValue = Array.isArray(value) ? value[0] : value;

  return firstValue?.trim().replace(/\s+/g, " ").slice(0, 120) ?? "";
}

export function filterCaseSummaries<TCase extends CaseFilterableSummary>(
  cases: TCase[],
  filters: CaseListFilters
): TCase[] {
  const search = normalizeForMatch(filters.search ?? "");

  return cases.filter((caseItem) => {
    if (filters.court && !caseMatchesCourtFilter(caseItem, filters.court)) {
      return false;
    }

    if (!search) {
      return true;
    }

    const searchableText = normalizeForMatch(
      [
        caseItem.caseNumber,
        caseItem.clientName,
        caseItem.court,
        caseItem.docketNumber,
        caseItem.title
      ]
        .filter(Boolean)
        .join(" ")
    );

    return search.split(" ").every((token) => searchableText.includes(token));
  });
}

function caseMatchesCourtFilter(
  caseItem: CaseFilterableSummary,
  courtFilter: CaseCourtFilter
) {
  const court = normalizeForMatch(caseItem.court ?? "");

  if (!court) {
    return false;
  }

  if (courtFilter === "civil-comercial") {
    return court.includes("civil") && court.includes("comercial");
  }

  if (courtFilter === "laboral") {
    return (
      court.includes("laboral") || court.includes("tribunal del trabajo")
    );
  }

  return court.includes(courtFilter);
}

function normalizeForMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
