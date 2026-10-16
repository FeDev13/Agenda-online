"use client";

import { useActionState, useId, useRef, type ReactNode } from "react";

import type { ActionResult } from "@/types/action-result";
import { Button, type ButtonVariant } from "./button";
import { InlineNotice } from "./inline-notice";

const initialState: ActionResult = { ok: false, message: null };

export function ActionForm({
  action,
  children,
  label,
  pendingLabel = "Guardando…",
  confirmation,
  variant = "secondary",
  disabled = false,
  className = ""
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  label: string;
  pendingLabel?: string;
  confirmation?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_state: ActionResult, data: FormData) => action(data),
    initialState
  );
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const approved = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <div className="mutationAction">
      <form
        ref={form}
        action={formAction}
        className={className}
        onReset={(event) => event.preventDefault()}
        onSubmit={(event) => {
          if (pending || disabled) {
            event.preventDefault();
            return;
          }
          if (confirmation && !approved.current) {
            event.preventDefault();
            dialog.current?.showModal();
          }
          approved.current = false;
        }}
      >
        {children}
        <Button
          type="submit"
          variant={variant}
          compact
          disabled={disabled || pending}
          aria-busy={pending}
        >
          {pending ? pendingLabel : label}
        </Button>
      </form>
      {state.message ? (
        <InlineNotice tone={state.ok ? "success" : "error"}>{state.message}</InlineNotice>
      ) : null}
      {confirmation ? (
        <dialog
          ref={dialog}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="confirmationDialog"
        >
          <h2 id={titleId}>{label}</h2>
          <p id={descriptionId}>{confirmation}</p>
          <div className="inlineForm">
            <Button variant="secondary" autoFocus onClick={() => dialog.current?.close()}>
              Cancelar
            </Button>
            <Button
              variant={variant === "danger" ? "danger-confirm" : variant}
              onClick={() => {
                dialog.current?.close();
                approved.current = true;
                form.current?.requestSubmit();
              }}
            >
              Confirmar
            </Button>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
