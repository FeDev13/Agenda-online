import { canManageCaseAssignments } from "@/lib/domain/authorization";
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
          <h1>Team access</h1>
          <p>Active firm members and case assignments for restricted matter access.</p>
        </div>
      </div>

      <div className="grid two">
        <section className="panel" aria-labelledby="team-members-title">
          <h2 id="team-members-title">Active members</h2>
          {members.length ? (
            <div className="tableWrap">
              <table className="dataTable">
                <thead>
                  <tr>
                    <th scope="col">Member</th>
                    <th scope="col">Role</th>
                    <th scope="col">Assignments</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.profileId}>
                      <td>
                        <strong>{member.displayName ?? member.email}</strong>
                        <span>{member.email}</span>
                      </td>
                      <td>{member.role.replace("_", " ")}</td>
                      <td>{member.assignmentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="emptyState">No active firm members are visible.</p>
          )}
        </section>

        <section className="panel" aria-labelledby="assign-access-title">
          <h2 id="assign-access-title">Assign case access</h2>
          {!canAssign ? (
            <p className="errorText">Only admins and lawyers can assign case access.</p>
          ) : null}
          <AssignmentForm canAssign={canAssign} cases={cases} members={members} />
        </section>
      </div>

      <section
        aria-labelledby="case-assignments-title"
        className="panel"
        style={{ marginTop: 18 }}
      >
        <h2 id="case-assignments-title">Current assignments</h2>
        {assignments.length ? (
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th scope="col">Case</th>
                  <th scope="col">Member</th>
                  <th scope="col">Assignment role</th>
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
          <p className="emptyState">No explicit case assignments exist yet.</p>
        )}
      </section>
    </>
  );
}

function NoActiveFirm() {
  return (
    <section className="panel" aria-labelledby="no-firm-title">
      <h1 id="no-firm-title">No active firm access</h1>
      <p className="muted">An active firm membership is required to manage access.</p>
    </section>
  );
}
