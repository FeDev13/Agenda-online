import Link from "next/link";

import { canManageCases } from "@/lib/domain/authorization";
import { getCurrentUser } from "@/lib/server/auth";
import { listOpenCases } from "@/lib/server/cases";

import { NewCaseForm } from "./new-case-form";

export default async function CasesPage() {
  const user = await getCurrentUser();

  if (!user?.membership) {
    return <NoActiveFirm />;
  }

  const cases = await listOpenCases();
  const canCreate = canManageCases(user.membership.role);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Causas abiertas</h1>
          <p>Causas activas visibles según el estudio actual y las reglas de asignación.</p>
        </div>
      </div>
      <div className="grid two">
        <section className="panel" aria-labelledby="open-cases-title">
          <h2 id="open-cases-title">Listado de causas abiertas</h2>
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
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No hay causas abiertas visibles para esta cuenta.</p>
          )}
        </section>
        <section className="panel" aria-labelledby="create-case-title">
          <h2 id="create-case-title">Crear una causa</h2>
          {!canCreate ? (
            <p className="errorText">Solo administración y abogados pueden crear causas.</p>
          ) : null}
          <NewCaseForm canCreate={canCreate} />
        </section>
      </div>
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
