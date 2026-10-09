"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  CASE_COURT_FILTER_OPTIONS,
  type CaseCourtFilter,
  normalizeCaseCourtFilter
} from "@/features/cases/filters";

export function CaseCourtSidebarFilter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname !== "/app/cases") {
    return null;
  }

  const activeCourt = normalizeCaseCourtFilter(searchParams.get("court"));

  return (
    <section className="sidebarFilters" aria-labelledby="case-court-filter-title">
      <strong id="case-court-filter-title">Filtrar por fuero</strong>
      <div className="sidebarFilterList">
        <Link
          aria-current={!activeCourt ? "true" : undefined}
          className={!activeCourt ? "active" : undefined}
          href={buildCaseFilterHref(searchParams, null)}
        >
          Todos
        </Link>
        {CASE_COURT_FILTER_OPTIONS.map((option) => (
          <Link
            aria-current={activeCourt === option.value ? "true" : undefined}
            className={activeCourt === option.value ? "active" : undefined}
            href={buildCaseFilterHref(searchParams, option.value)}
            key={option.value}
          >
            {option.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function buildCaseFilterHref(
  currentSearchParams: ReturnType<typeof useSearchParams>,
  courtFilter: CaseCourtFilter | null
) {
  const nextParams = new URLSearchParams(currentSearchParams.toString());

  if (courtFilter) {
    nextParams.set("court", courtFilter);
  } else {
    nextParams.delete("court");
  }

  if (!nextParams.get("q")?.trim()) {
    nextParams.delete("q");
  }

  const queryString = nextParams.toString();

  return queryString ? `/app/cases?${queryString}` : "/app/cases";
}
