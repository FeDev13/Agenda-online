import Link from "next/link";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { InlineNotice } from "@/components/inline-notice";
import { CaseCourtFilter } from "@/features/cases/case-court-filter";

import {
  filterCaseSummaries,
  normalizeCaseCourtFilter,
  normalizeCaseSearchQuery
} from "@/features/cases/filters";
import {
  canArchiveCases,
  canManageCases,
  canPermanentlyDeleteCases
} from "@/lib/domain/authorization";
import { getCurrentUser } from "@/lib/server/auth";
import { listArchivedCases, listOpenCases } from "@/lib/server/cases";

import { archiveCaseAction } from "./actions";
import { NewCaseForm } from "./new-case-form";
import { PermanentDeleteCaseForm } from "./permanent-delete-case-form";

type CasesPageProps = {
  searchParams: Promise<{
    court?: string | string[];
    q?: string | string[];
  }>;
};

export default async function CasesPage({ searchParams }: CasesPageProps) {
  const user = await getCurrentUser();

  if (!user?.membership) {
    return <NoActiveFirm />;
  }

  const params = await searchParams;
  const courtFilter = normalizeCaseCourtFilter(params.court);
  const searchQuery = normalizeCaseSearchQuery(params.q);
  const caseOptions = await listOpenCases();
  const cases = filterCaseSummaries(caseOptions, {
    court: courtFilter,
    search: searchQuery
  });
  const canCreate = canManageCases(user.membership.role);
  const canArchive = canArchiveCases(user.membership.role);
  const canPermanentlyDelete = canPermanentlyDeleteCases(user.membership.role);
  const archivedCases = canPermanentlyDelete ? await listArchivedCases() : [];
  const hasActiveFilters = Boolean(courtFilter || searchQuery);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Causas abiertas</h1>
          <p>Buscá una causa por cliente, número, expediente o juzgado.</p>
        </div>
      </div>
      {canCreate ? (
        <details className="panel disclosure" id="create-case">
          <summary>Crear causa</summary>
          <h2 id="create-case-title">Crear una causa</h2>
          <NewCaseForm canCreate={canCreate} />
        </details>
      ) : (
        <InlineNotice>
          Tu acceso permite consultar las causas asignadas. Para crear una causa, consultá
          con un abogado o la administración.
        </InlineNotice>
      )}
      <div className="grid">
        <section className="panel" aria-labelledby="open-cases-title">
          <div className="sectionHeader">
            <h2 id="open-cases-title">Listado de causas abiertas</h2>
            <span className="badge">
              {cases.length} {cases.length === 1 ? "visible" : "visibles"}
            </span>
          </div>
          <form action="/app/cases" className="caseSearchForm" role="search">
            {courtFilter ? (
              <input name="court" type="hidden" value={courtFilter} />
            ) : null}
            <div className="field caseSearchField">
              <label htmlFor="case-search">Buscar causa</label>
              <input
                autoComplete="off"
                defaultValue={searchQuery}
                id="case-search"
                list="case-search-options"
                name="q"
                placeholder="Nombre, cliente, número o expediente"
                type="search"
              />
              <datalist id="case-search-options">
                {caseOptions.map((caseItem) => (
                  <option
                    key={caseItem.id}
                    label={`${caseItem.clientName} · ${caseItem.caseNumber}`}
                    value={`${caseItem.title} ${caseItem.caseNumber}`}
                  />
                ))}
              </datalist>
            </div>
            <div className="inlineForm">
              <button className="secondaryButton compactButton" type="submit">
                Buscar
              </button>
              {hasActiveFilters ? (
                <Link className="secondaryButton compactButton" href="/app/cases">
                  Limpiar
                </Link>
              ) : null}
            </div>
          </form>
          <Suspense fallback={null}>
            <CaseCourtFilter />
          </Suspense>
          {hasActiveFilters ? (
            <p className="muted">
              Filtros activos:{" "}
              {[searchQuery ? `“${searchQuery}”` : null, courtFilter]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          {cases.length ? (
            <ul className="caseList">
              {cases.map((caseItem) => (
                <li className="card" key={caseItem.id}>
                  <div className="cardHeader">
                    <div>
                      <strong>{caseItem.title}</strong>
                      <p className="muted">
                        {caseItem.clientName}
                        {caseItem.court ? ` · ${caseItem.court}` : ""}
                        {caseItem.docketNumber ? ` · ${caseItem.docketNumber}` : ""}
                      </p>
                      <Link className="textLink" href={`/app/cases/${caseItem.id}`}>
                        Ver causa
                      </Link>
                    </div>
                    <span className="badge">{caseItem.caseNumber}</span>
                  </div>
                  {canArchive ? (
                    <ActionForm
                      action={archiveCaseAction}
                      className="cardFooterAction"
                      label="Archivar causa"
                      pendingLabel="Archivando…"
                      confirmation={`La causa ${caseItem.caseNumber} dejará de aparecer entre las causas abiertas. Sus datos se conservarán.`}
                    >
                      <input name="caseId" type="hidden" value={caseItem.id} />
                    </ActionForm>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">
              {hasActiveFilters
                ? "No hay causas abiertas que coincidan con la búsqueda actual."
                : "No hay causas abiertas visibles para esta cuenta."}
            </p>
          )}
        </section>
      </div>
      {canPermanentlyDelete ? (
        <details className="panel archivedCasesPanel disclosure">
          <summary>Causas archivadas · {archivedCases.length}</summary>
          <div className="sectionHeader">
            <h2 id="archived-cases-title">Causas archivadas</h2>
            <span className="badge">{archivedCases.length} archivadas</span>
          </div>
          {archivedCases.length ? (
            <ul className="caseList">
              {archivedCases.map((caseItem) => (
                <li className="card" key={caseItem.id}>
                  <div className="cardHeader">
                    <div>
                      <strong>{caseItem.title}</strong>
                      <p className="muted">
                        {caseItem.clientName}
                        {caseItem.court ? ` · ${caseItem.court}` : ""}
                        {caseItem.docketNumber ? ` · ${caseItem.docketNumber}` : ""}
                      </p>
                    </div>
                    <span className="badge">{caseItem.caseNumber}</span>
                  </div>
                  <details className="disclosure">
                    <summary>Eliminar definitivamente</summary>
                    <p className="notice notice-error">
                      Esta acción es irreversible. Solo corresponde para datos sintéticos
                      o un procedimiento de retención aprobado. Escribí el número de causa
                      para confirmar.
                    </p>
                    <PermanentDeleteCaseForm
                      caseId={caseItem.id}
                      caseNumber={caseItem.caseNumber}
                    />
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No hay causas archivadas.</p>
          )}
        </details>
      ) : null}
    </>
  );
}

function NoActiveFirm() {
  return (
    <section className="panel" aria-labelledby="no-firm-title">
      <h1 id="no-firm-title">Sin acceso activo al estudio</h1>
      <p className="muted">Se requiere una membresía activa para ver causas.</p>
    </section>
  );
}
