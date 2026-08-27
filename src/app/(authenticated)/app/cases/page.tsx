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
          <h1>Open cases</h1>
          <p>Visible active matters for the current firm and assignment rules.</p>
        </div>
      </div>
      <div className="grid two">
        <section className="panel" aria-labelledby="open-cases-title">
          <h2 id="open-cases-title">Open case list</h2>
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
                        View case
                      </Link>
                    </div>
                    <span className="badge">{caseItem.caseNumber}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No open cases are visible to this account.</p>
          )}
        </section>
        <section className="panel" aria-labelledby="create-case-title">
          <h2 id="create-case-title">Create a case</h2>
          {!canCreate ? (
            <p className="errorText">Only admins and lawyers can create cases.</p>
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
      <h1 id="no-firm-title">No active firm access</h1>
      <p className="muted">An active firm membership is required to view cases.</p>
    </section>
  );
}
