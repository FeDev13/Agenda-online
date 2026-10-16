"use client";

import { useActionState, useRef, type FormEvent } from "react";

// React resets uncontrolled forms after resolved actions, including validation failures.
// Keep the failed submission editable without persisting confidential input elsewhere.
export function useFormAction<State extends { message: string | null; ok?: boolean }>(
  action: (state: Awaited<State>, data: FormData) => Promise<State>,
  initialState: Awaited<State>
) {
  const succeeded = useRef(false);
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (previous, data) => {
      const next = await action(previous, data);
      succeeded.current = next.ok === true;
      return next;
    },
    initialState
  );

  function onReset(event: FormEvent<HTMLFormElement>) {
    if (!succeeded.current) event.preventDefault();
  }

  return { state, formAction, pending, onReset };
}
