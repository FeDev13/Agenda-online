import { canManageCaseAssignments } from "@/lib/domain/authorization";
import { formatFirmRole } from "@/lib/display-labels";
import { getCurrentUser } from "@/lib/server/auth";
import { listOpenCases } from "@/lib/server/cases";
import { listCaseAssignments, listFirmMembers } from "@/lib/server/team";

import { AssignmentForm } from "./assignment-form";

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (!user?.membership) {
    return <NoActiveFirm />;
  }

  const [members, cases, assignments] = await Promise.all([
    listFirmMembers(),
    listOpenCases(),
    listCaseAssignments()
  ]);
  const canAssign = canManageCaseAssignments(user.membership.role);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Accesos</h1>
          <p>Integrantes activos y asignaciones para acceso restringido a causas.</p>
        </div>
      </div>

      <div className="grid two">
        <section className="panel" aria-labelledby="team-members-title">
          <h2 id="team-members-title">Integrantes activos</h2>
          {members.length ? (
            <div className="tableWrap">
              <table className="dataTable">
                <thead>
                  <tr>
                    <th scope="col">Integrante</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Asignaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.profileId}>
                      <td>
                        <strong>{member.displayName ?? member.email}</strong>
                        <span>{member.email}</span>
                      </td>
                      <td>{formatFirmRole(member.role)}</td>
                      <td>{member.assignmentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="emptyState">No hay integrantes activos visibles.</p>
          )}
        </section>

        <section className="panel" aria-labelledby="assign-access-title">
          <h2 id="assign-access-title">Asignar acceso a causa</h2>
          {!canAssign ? (
            <p className="errorText">
              Solo administración y abogados pueden asignar acceso a causas.
            </p>
          ) : null}
          <AssignmentForm canAssign={canAssign} cases={cases} members={members} />
        </section>
      </div>

      <section
        aria-labelledby="case-assignments-title"
        className="panel"
        style={{ marginTop: 18 }}
      >
        <h2 id="case-assignments-title">Asignaciones actuales</h2>
        {assignments.length ? (
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th scope="col">Causa</th>
                  <th scope="col">Integrante</th>
                  <th scope="col">Rol de asignación</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={`${assignment.caseId}-${assignment.profileId}`}>
                    <td>
                      <strong>{assignment.caseNumber}</strong>
                      <span>{assignment.caseTitle}</span>
                    </td>
                    <td>
                      <strong>{assignment.displayName ?? assignment.email}</strong>
                      <span>{assignment.email}</span>
                    </td>
                    <td>{assignment.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="emptyState">Todavía no hay asignaciones explícitas de causas.</p>
        )}
      </section>
    </>
  );
}

function NoActiveFirm() {
  return (
    <section className="panel" aria-labelledby="no-firm-title">
      <h1 id="no-firm-title">Sin acceso activo al estudio</h1>
      <p className="muted">Se requiere una membresía activa para gestionar accesos.</p>
    </section>
  );
}
