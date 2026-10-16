import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { InlineNotice } from "@/components/inline-notice";
import {
  formatDateOnly,
  formatFileSize,
  formatFileType,
  formatDueLabel
} from "@/lib/presentation";

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
import { CaseNoteItem } from "./case-note-item";
import { updateTaskStatusAction } from "./actions";

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
  const displayTimeZone =
    process.env.DEFAULT_FIRM_TIMEZONE ?? "America/Argentina/Buenos_Aires";
  const canManageAnyNote =
    user.membership.role === "admin" || user.membership.role === "lawyer";

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

      <dl className="panel caseMetadata" aria-label="Resumen de la causa">
        <div>
          <dt>Fecha de apertura</dt>
          <dd>{formatDateOnly(caseItem.openedOn)}</dd>
        </div>
        <div>
          <dt>Jurisdicción</dt>
          <dd>{caseItem.jurisdiction ?? "Sin datos"}</dd>
        </div>
        <div>
          <dt>Integrantes</dt>
          <dd>{members.length}</dd>
        </div>
      </dl>
      <nav className="sectionNav" aria-label="Secciones de la causa">
        <a href="#notes-title">Notas</a>
        <a href="#tasks-title">Tareas</a>
        <a href="#documents-title">Documentos</a>
      </nav>

      {caseItem.description ? (
        <section className="panel" style={{ marginTop: 18 }}>
          <h2>Descripción</h2>
          <p>{caseItem.description}</p>
        </section>
      ) : null}

      <div className="grid two" style={{ marginTop: 18 }}>
        <section className="panel" aria-labelledby="notes-title">
          <h2 id="notes-title">Notas</h2>
          {canManage ? (
            <details className="disclosure contextForm">
              <summary>Agregar nota</summary>
              <CaseWorkForms
                canManage={canManage}
                caseId={caseId}
                members={members}
                section="note"
              />
            </details>
          ) : null}
          {notes.length ? (
            <ul className="caseList">
              {notes.map((note) => {
                const canManageNote =
                  canManage && (canManageAnyNote || note.createdById === user.id);

                return (
                  <CaseNoteItem
                    canManage={canManageNote}
                    caseId={caseId}
                    key={`${note.id}:${note.updatedAt}`}
                    note={note}
                    timeZone={displayTimeZone}
                  />
                );
              })}
            </ul>
          ) : (
            <p className="emptyState">No hay notas visibles para esta causa.</p>
          )}
        </section>

        <section className="panel" aria-labelledby="tasks-title">
          <h2 id="tasks-title">Tareas</h2>
          {canManage ? (
            <details className="disclosure contextForm">
              <summary>Agregar tarea</summary>
              <CaseWorkForms
                canManage={canManage}
                caseId={caseId}
                members={members}
                section="task"
              />
            </details>
          ) : null}
          {tasks.length ? (
            <ul className="caseList">
              {tasks.map((task) => (
                <li className="card" key={task.id}>
                  <div className="cardHeader">
                    <div>
                      <strong>{task.title}</strong>
                      <p className="muted">
                        {task.assignedToName ?? "Sin asignar"}
                        {task.dueOn
                          ? ` · ${formatDateOnly(task.dueOn)}${task.status === "open" ? ` · ${formatDueLabel(task.dueOn, new Date(), displayTimeZone) ?? "Con vencimiento"}` : ""}`
                          : ""}
                      </p>
                    </div>
                    <div className="stackedActions">
                      <span className="badge">{formatTaskStatus(task.status)}</span>
                      {canManage ? (
                        <ActionForm
                          action={updateTaskStatusAction}
                          label={task.status === "completed" ? "Reabrir" : "Completar"}
                        >
                          <input name="caseId" type="hidden" value={caseId} />
                          <input name="taskId" type="hidden" value={task.id} />
                          <input
                            name="status"
                            type="hidden"
                            value={task.status === "completed" ? "open" : "completed"}
                          />
                        </ActionForm>
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
        {canManage ? (
          <details className="disclosure contextForm">
            <summary>Subir documento</summary>
            <CaseWorkForms
              canManage={canManage}
              caseId={caseId}
              members={members}
              section="document"
            />
          </details>
        ) : null}
        {documents.length ? (
          <div
            className="tableWrap"
            role="region"
            aria-label="Documentos de la causa"
            tabIndex={0}
          >
            <table className="dataTable">
              <thead>
                <tr>
                  <th scope="col">Documento</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Tamaño</th>
                  <th scope="col">Descarga</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td>{document.displayName}</td>
                    <td>{formatFileType(document.mimeType)}</td>
                    <td>{formatFileSize(document.sizeBytes)}</td>
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

      {!canManage ? (
        <InlineNotice>Tu rol puede ver esta causa, pero no agregar trabajo.</InlineNotice>
      ) : null}
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
