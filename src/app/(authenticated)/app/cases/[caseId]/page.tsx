import Link from "next/link";

import { canManageCaseWork } from "@/lib/domain/authorization";
import { getCurrentUser } from "@/lib/server/auth";
import {
  getCaseDetail,
  listAssignableCaseMembers,
  listCaseDocuments,
  listCaseNotes,
  listCaseTasks
} from "@/lib/server/case-detail";

import { CaseWorkForms } from "./case-work-forms";
import { archiveNoteAction, updateTaskStatusAction } from "./actions";

export default async function CaseDetailPage({
  params
}: {
  params: Promise<{ caseId: string }>;
}) {
  const [{ caseId }, user] = await Promise.all([params, getCurrentUser()]);

  if (!user?.membership) {
    return <NoActiveFirm />;
  }

  const [caseItem, notes, tasks, documents, members] = await Promise.all([
    getCaseDetail(caseId),
    listCaseNotes(caseId),
    listCaseTasks(caseId),
    listCaseDocuments(caseId),
    listAssignableCaseMembers(caseId)
  ]);
  const canManage = canManageCaseWork(user.membership.role);

  return (
    <>
      <div className="pageHeader">
        <div>
          <p className="muted">
            <Link href="/app/cases">Open cases</Link> / {caseItem.caseNumber}
          </p>
          <h1>{caseItem.title}</h1>
          <p>
            {caseItem.clientName}
            {caseItem.court ? ` · ${caseItem.court}` : ""}
            {caseItem.docketNumber ? ` · ${caseItem.docketNumber}` : ""}
          </p>
        </div>
        <span className="badge">{caseItem.status}</span>
      </div>

      <section className="metricGrid" aria-label="Case summary">
        <div className="metric">
          <span>Opened</span>
          <strong>{caseItem.openedOn}</strong>
        </div>
        <div className="metric">
          <span>Jurisdiction</span>
          <strong>{caseItem.jurisdiction ?? "Not set"}</strong>
        </div>
        <div className="metric">
          <span>Case members</span>
          <strong>{members.length}</strong>
        </div>
      </section>

      {caseItem.description ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <h2>Description</h2>
          <p>{caseItem.description}</p>
        </section>
      ) : null}

      <div className="grid two" style={{ marginTop: 18 }}>
        <section className="panel" aria-labelledby="notes-title">
          <h2 id="notes-title">Notes</h2>
          {notes.length ? (
            <ul className="caseList">
              {notes.map((note) => (
                <li className="card" key={note.id}>
                  <p>{note.body}</p>
                  <div className="actionRow">
                    <p className="muted">
                      {note.createdByName} · {new Date(note.createdAt).toLocaleString()}
                    </p>
                    {canManage ? (
                      <form action={archiveNoteAction}>
                        <input name="caseId" type="hidden" value={caseId} />
                        <input name="noteId" type="hidden" value={note.id} />
                        <button className="secondaryButton compactButton" type="submit">
                          Archive
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No notes are visible for this case.</p>
          )}
        </section>

        <section className="panel" aria-labelledby="tasks-title">
          <h2 id="tasks-title">Tasks</h2>
          {tasks.length ? (
            <ul className="caseList">
              {tasks.map((task) => (
                <li className="card" key={task.id}>
                  <div className="cardHeader">
                    <div>
                      <strong>{task.title}</strong>
                      <p className="muted">
                        {task.assignedToName ?? "Unassigned"}
                        {task.dueOn ? ` · due ${task.dueOn}` : ""}
                      </p>
                    </div>
                    <div className="stackedActions">
                      <span className="badge">{task.status}</span>
                      {canManage ? (
                        <form action={updateTaskStatusAction}>
                          <input name="caseId" type="hidden" value={caseId} />
                          <input name="taskId" type="hidden" value={task.id} />
                          <input
                            name="status"
                            type="hidden"
                            value={task.status === "completed" ? "open" : "completed"}
                          />
                          <button className="secondaryButton compactButton" type="submit">
                            {task.status === "completed" ? "Reopen" : "Complete"}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No tasks are visible for this case.</p>
          )}
        </section>
      </div>

      <section
        className="panel"
        style={{ marginTop: 18 }}
        aria-labelledby="documents-title"
      >
        <h2 id="documents-title">Document metadata</h2>
        {documents.length ? (
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col">MIME type</th>
                  <th scope="col">Size</th>
                  <th scope="col">Download</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td>{document.displayName}</td>
                    <td>{document.mimeType ?? "Not set"}</td>
                    <td>{document.sizeBytes ?? "Not set"}</td>
                    <td>
                      <a
                        className="textLink"
                        href={`/app/cases/${caseId}/documents/${document.id}/download`}
                      >
                        Signed link
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="emptyState">No document metadata is visible for this case.</p>
        )}
      </section>

      <section style={{ marginTop: 18 }}>
        {!canManage ? (
          <p className="errorText">Your role can view this case but cannot add work.</p>
        ) : null}
        <CaseWorkForms canManage={canManage} caseId={caseId} members={members} />
      </section>
    </>
  );
}

function NoActiveFirm() {
  return (
    <section className="panel" aria-labelledby="no-firm-title">
      <h1 id="no-firm-title">No active firm access</h1>
      <p className="muted">An active firm membership is required to view a case.</p>
    </section>
  );
}
