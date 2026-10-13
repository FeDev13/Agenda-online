import Link from "next/link";

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
          <p>
            Causas activas visibles según el estudio actual y las reglas de asignación.
          </p>
        </div>
      </div>
      <div className="grid two">
        <section className="panel" aria-labelledby="open-cases-title">
          <div className="sectionHeader">
            <h2 id="open-cases-title">Listado de causas abiertas</h2>
            <span className="badge">{cases.length} visibles</span>
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
              <button className="button compactButton" type="submit">
                Buscar
              </button>
              {hasActiveFilters ? (
                <Link className="secondaryButton compactButton" href="/app/cases">
                  Limpiar
                </Link>
              ) : null}
            </div>
          </form>
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
                    <form action={archiveCaseAction} className="cardFooterAction">
                      <input name="caseId" type="hidden" value={caseItem.id} />
                      <button
                        className="secondaryButton dangerButton compactButton"
                        type="submit"
                      >
                        Archivar causa
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">
              {hasActiveFilters
                ? "No hay causas abiertas que coincidan con la busqueda actual."
                : "No hay causas abiertas visibles para esta cuenta."}
            </p>
          )}
        </section>
        <section className="panel" aria-labelledby="create-case-title">
          <h2 id="create-case-title">Crear una causa</h2>
          {!canCreate ? (
            <p className="errorText">
              Solo administración y abogados pueden crear causas.
            </p>
          ) : null}
          <NewCaseForm canCreate={canCreate} />
        </section>
      </div>
      {canPermanentlyDelete ? (
        <section className="panel archivedCasesPanel" aria-labelledby="archived-cases-title">
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
                  <PermanentDeleteCaseForm
                    caseId={caseItem.id}
                    caseNumber={caseItem.caseNumber}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No hay causas archivadas.</p>
          )}
        </section>
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
