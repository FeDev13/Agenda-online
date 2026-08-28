import Link from "next/link";

import { formatCaseStatus, formatTaskStatus } from "@/lib/display-labels";
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
            <Link href="/app/cases">Causas abiertas</Link> / {caseItem.caseNumber}
          </p>
          <h1>{caseItem.title}</h1>
          <p>
            {caseItem.clientName}
            {caseItem.court ? ` · ${caseItem.court}` : ""}
            {caseItem.docketNumber ? ` · ${caseItem.docketNumber}` : ""}
          </p>
        </div>
        <span className="badge">{formatCaseStatus(caseItem.status)}</span>
      </div>

      <section className="metricGrid" aria-label="Resumen de la causa">
        <div className="metric">
          <span>Fecha de apertura</span>
          <strong>{caseItem.openedOn}</strong>
        </div>
        <div className="metric">
          <span>Jurisdicción</span>
          <strong>{caseItem.jurisdiction ?? "Sin datos"}</strong>
        </div>
        <div className="metric">
          <span>Integrantes</span>
          <strong>{members.length}</strong>
        </div>
      </section>

      {caseItem.description ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <h2>Descripción</h2>
          <p>{caseItem.description}</p>
        </section>
      ) : null}

      <div className="grid two" style={{ marginTop: 18 }}>
        <section className="panel" aria-labelledby="notes-title">
          <h2 id="notes-title">Notas</h2>
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
                          Archivar
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No hay notas visibles para esta causa.</p>
          )}
        </section>

        <section className="panel" aria-labelledby="tasks-title">
          <h2 id="tasks-title">Tareas</h2>
          {tasks.length ? (
            <ul className="caseList">
              {tasks.map((task) => (
                <li className="card" key={task.id}>
                  <div className="cardHeader">
                    <div>
                      <strong>{task.title}</strong>
                      <p className="muted">
                        {task.assignedToName ?? "Sin asignar"}
                        {task.dueOn ? ` · vence ${task.dueOn}` : ""}
                      </p>
                    </div>
                    <div className="stackedActions">
                      <span className="badge">{formatTaskStatus(task.status)}</span>
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
                            {task.status === "completed" ? "Reabrir" : "Completar"}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyState">No hay tareas visibles para esta causa.</p>
          )}
        </section>
      </div>

      <section
        className="panel"
        style={{ marginTop: 18 }}
        aria-labelledby="documents-title"
      >
        <h2 id="documents-title">Documentos</h2>
        {documents.length ? (
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr>
                  <th scope="col">Documento</th>
                  <th scope="col">Tipo MIME</th>
                  <th scope="col">Tamaño</th>
                  <th scope="col">Descarga</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td>{document.displayName}</td>
                    <td>{document.mimeType ?? "Sin datos"}</td>
                    <td>{document.sizeBytes ?? "Sin datos"}</td>
                    <td>
                      <a
                        className="textLink"
                        href={`/app/cases/${caseId}/documents/${document.id}/download`}
                      >
                        Descargar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="emptyState">No hay documentos visibles para esta causa.</p>
        )}
      </section>

      <section style={{ marginTop: 18 }}>
        {!canManage ? (
          <p className="errorText">Tu rol puede ver esta causa, pero no agregar trabajo.</p>
        ) : null}
        <CaseWorkForms canManage={canManage} caseId={caseId} members={members} />
      </section>
    </>
  );
}

function NoActiveFirm() {
  return (
    <section className="panel" aria-labelledby="no-firm-title">
      <h1 id="no-firm-title">Sin acceso activo al estudio</h1>
      <p className="muted">Se requiere una membresía activa para ver una causa.</p>
    </section>
  );
}
