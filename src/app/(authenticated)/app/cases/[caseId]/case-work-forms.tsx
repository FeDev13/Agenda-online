"use client";

import { useActionState } from "react";

import type { CaseMemberOption } from "@/lib/server/case-detail";

import {
  createNoteAction,
  createTaskAction,
  uploadDocumentAction,
  type CaseDetailFormState
} from "./actions";

const initialState: CaseDetailFormState = { message: null, ok: false };

export function CaseWorkForms({
  canManage,
  caseId,
  members
}: {
  canManage: boolean;
  caseId: string;
  members: CaseMemberOption[];
}) {
  const [noteState, noteAction, notePending] = useActionState(
    createNoteAction,
    initialState
  );
  const [taskState, taskAction, taskPending] = useActionState(
    createTaskAction,
    initialState
  );
  const [documentState, documentAction, documentPending] = useActionState(
    uploadDocumentAction,
    initialState
  );

  return (
    <div className="grid">
      <section className="panel" aria-labelledby="new-note-title">
        <h2 id="new-note-title">Add note</h2>
        <form action={noteAction} className="formGrid">
          <input name="caseId" type="hidden" value={caseId} />
          <div className="field">
            <label htmlFor="note-body">Note</label>
            <textarea disabled={!canManage} id="note-body" name="body" required />
          </div>
          {noteState.message ? (
            <p aria-live="polite" className={noteState.ok ? "muted" : "errorText"}>
              {noteState.message}
            </p>
          ) : null}
          <button className="button" disabled={!canManage || notePending} type="submit">
            {notePending ? "Saving..." : "Save note"}
          </button>
        </form>
      </section>

      <section className="panel" aria-labelledby="new-task-title">
        <h2 id="new-task-title">Add task</h2>
        <form action={taskAction} className="formGrid">
          <input name="caseId" type="hidden" value={caseId} />
          <div className="field">
            <label htmlFor="task-title">Title</label>
            <input disabled={!canManage} id="task-title" name="title" required />
          </div>
          <div className="fieldRow">
            <div className="field">
              <label htmlFor="task-due-on">Due date</label>
              <input disabled={!canManage} id="task-due-on" name="dueOn" type="date" />
            </div>
            <div className="field">
              <label htmlFor="task-assigned-to">Assigned to</label>
              <select disabled={!canManage} id="task-assigned-to" name="assignedTo">
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.profileId} value={member.profileId}>
                    {member.displayName ?? member.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {taskState.message ? (
            <p aria-live="polite" className={taskState.ok ? "muted" : "errorText"}>
              {taskState.message}
            </p>
          ) : null}
          <button className="button" disabled={!canManage || taskPending} type="submit">
            {taskPending ? "Saving..." : "Save task"}
          </button>
        </form>
      </section>

      <section className="panel" aria-labelledby="new-document-title">
        <h2 id="new-document-title">Upload document</h2>
        <form action={documentAction} className="formGrid">
          <input name="caseId" type="hidden" value={caseId} />
          <div className="field">
            <label htmlFor="document-file">File</label>
            <input
              accept="application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={!canManage}
              id="document-file"
              name="file"
              required
              type="file"
            />
          </div>
          <div className="field">
            <label htmlFor="document-name">Display name</label>
            <input disabled={!canManage} id="document-name" name="displayName" />
          </div>
          {documentState.message ? (
            <p aria-live="polite" className={documentState.ok ? "muted" : "errorText"}>
              {documentState.message}
            </p>
          ) : null}
          <button
            className="button"
            disabled={!canManage || documentPending}
            type="submit"
          >
            {documentPending ? "Uploading..." : "Upload document"}
          </button>
        </form>
      </section>
    </div>
  );
}
