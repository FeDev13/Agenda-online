import {
  canManageCaseAssignments,
  canManageFirmMemberships
} from "@/lib/domain/authorization";
import {
  formatAssignmentRole,
  formatAuditAction,
  formatFirmRole,
  formatMembershipStatus
} from "@/lib/display-labels";
import { getCurrentUser } from "@/lib/server/auth";
import { listOpenCases } from "@/lib/server/cases";
import {
  listCaseAssignments,
  listFirmMembers,
  listRecentAuditEntries
} from "@/lib/server/team";
import type { FirmRole } from "@/types/database";

import { AssignmentForm } from "./assignment-form";
import {
  deactivateFirmMemberAction,
  removeCaseAssignmentAction,
  updateFirmMemberRoleAction
} from "./actions";
import { InviteMemberForm } from "./invite-member-form";

const roleOptions: FirmRole[] = ["admin", "lawyer", "paralegal", "read_only"];

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (!user?.membership) {
    return <NoActiveFirm />;
  }

  const [members, cases, assignments, auditEntries] = await Promise.all([
    listFirmMembers(),
    listOpenCases(),
    listCaseAssignments(),
    listRecentAuditEntries()
  ]);
  const canAssign = canManageCaseAssignments(user.membership.role);
  const canManageMembers = canManageFirmMemberships(user.membership.role);
  const activeMembers = members.filter((member) => member.status === "active");

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>Accesos</h1>
          <p>Integrantes activos y asignaciones para acceso restringido a causas.</p>
        </div>
      </div>

      <section
        aria-labelledby="invite-member-title"
        className="panel"
        style={{ marginBottom: 18 }}
      >
        <h2 id="invite-member-title">Invitar integrante</h2>
        {!canManageMembers ? (
          <p className="errorText">Solo administración puede invitar integrantes.</p>
        ) : null}
        <InviteMemberForm canInvite={canManageMembers} />
      </section>

      <div className="grid two">
        <section className="panel" aria-labelledby="team-members-title">
          <h2 id="team-members-title">Integrantes del estudio</h2>
          {members.length ? (
            <div className="tableWrap">
              <table className="dataTable">
                <thead>
                  <tr>
                    <th scope="col">Integrante</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Asignaciones</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const isSelf = member.profileId === user.id;
                    const memberActionsDisabled =
                      !canManageMembers || isSelf || member.status !== "active";

                    return (
                      <tr key={member.profileId}>
                        <td>
                          <strong>{member.displayName ?? member.email}</strong>
                          <span>{member.email}</span>
                        </td>
                        <td>{formatFirmRole(member.role)}</td>
                        <td>{formatMembershipStatus(member.status)}</td>
                        <td>{member.assignmentCount}</td>
                        <td>
                          <div className="stackedActions">
                            <form
                              action={updateFirmMemberRoleAction}
                              className="inlineForm"
                            >
                              <input
                                name="profileId"
                                type="hidden"
                                value={member.profileId}
                              />
                              <select
                                aria-label={`Rol de ${member.displayName ?? member.email}`}
                                defaultValue={member.role}
                                disabled={memberActionsDisabled}
                                name="role"
                              >
                                {roleOptions.map((role) => (
                                  <option key={role} value={role}>
                                    {formatFirmRole(role)}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="secondaryButton compactButton"
                                disabled={memberActionsDisabled}
                                type="submit"
                              >
                                Cambiar rol
                              </button>
                            </form>
                            <form action={deactivateFirmMemberAction}>
                              <input
                                name="profileId"
                                type="hidden"
                                value={member.profileId}
                              />
                              <button
                                className="secondaryButton compactButton dangerButton"
                                disabled={memberActionsDisabled}
                                type="submit"
                              >
                                Desactivar
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
          <AssignmentForm canAssign={canAssign} cases={cases} members={activeMembers} />
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
                  <th scope="col">Acciones</th>
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
                    <td>{formatAssignmentRole(assignment.role)}</td>
                    <td>
                      <form action={removeCaseAssignmentAction}>
                        <input name="caseId" type="hidden" value={assignment.caseId} />
                        <input
                          name="profileId"
                          type="hidden"
                          value={assignment.profileId}
                        />
                        <button
                          className="secondaryButton compactButton dangerButton"
                          disabled={!canAssign}
                          type="submit"
                        >
                          Remover acceso
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="emptyState">Todavía no hay asignaciones explícitas de causas.</p>
        )}
      </section>

      <section
        aria-labelledby="audit-log-title"
        className="panel"
        style={{ marginTop: 18 }}
      >
        <h2 id="audit-log-title">Auditoría reciente</h2>
        {canAssign && auditEntries.length ? (
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th scope="col">Acción</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Objetivo</th>
                  <th scope="col">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatAuditAction(entry.action)}</td>
                    <td>
                      <strong>{entry.actorName ?? entry.actorEmail}</strong>
                      <span>{entry.actorEmail}</span>
                    </td>
                    <td>
                      <strong>{entry.targetTable}</strong>
                      <span>{entry.targetId ?? "Sin identificador"}</span>
                    </td>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="emptyState">No hay eventos de auditoría visibles.</p>
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
