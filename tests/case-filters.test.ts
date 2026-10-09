import { describe, expect, it } from "vitest";

import {
  filterCaseSummaries,
  normalizeCaseCourtFilter,
  normalizeCaseSearchQuery
} from "@/features/cases/filters";

const cases = [
  {
    caseNumber: "EXP-001",
    clientName: "Ana Perez",
    court: "Juzgado Federal 1",
    docketNumber: "F-10",
    title: "Amparo previsional"
  },
  {
    caseNumber: "EXP-002",
    clientName: "Comercial Rio",
    court: "Civil y Comercial 3",
    docketNumber: "CC-20",
    title: "Cobro ejecutivo"
  },
  {
    caseNumber: "EXP-003",
    clientName: "Maria Gomez",
    court: "Juzgado de Familia",
    docketNumber: "FA-30",
    title: "Regimen de comunicacion"
  }
];

describe("case filters", () => {
  it("normalizes supported court filters and search queries", () => {
    expect(normalizeCaseCourtFilter("laboral")).toBe("laboral");
    expect(normalizeCaseCourtFilter("penal")).toBeNull();
    expect(normalizeCaseSearchQuery("  Ana   Perez  ")).toBe("Ana Perez");
  });

  it("filters cases by court category", () => {
    expect(filterCaseSummaries(cases, { court: "federal" })).toHaveLength(1);
    expect(filterCaseSummaries(cases, { court: "civil-comercial" })).toEqual([
      cases[1]
    ]);
    expect(filterCaseSummaries(cases, { court: "familia" })).toEqual([cases[2]]);
  });

  it("matches case search across case, client, court, and docket fields", () => {
    expect(filterCaseSummaries(cases, { search: "ana exp-001" })).toEqual([
      cases[0]
    ]);
    expect(filterCaseSummaries(cases, { search: "comercial cc-20" })).toEqual([
      cases[1]
    ]);
    expect(filterCaseSummaries(cases, { search: "comunicacion familia" })).toEqual([
      cases[2]
    ]);
  });
});
