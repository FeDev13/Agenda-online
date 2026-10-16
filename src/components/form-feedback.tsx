"use client";

import { useEffect, useRef } from "react";
import type { ActionResult } from "@/types/action-result";

export function FormFeedback({ state }: { state: ActionResult }) {
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.message && !state.ok) feedback.current?.focus();
  }, [state]);
  if (!state.message) return null;
  return (
    <p
      ref={feedback}
      tabIndex={-1}
      role="status"
      className={`notice notice-${state.ok ? "success" : "error"}`}
    >
      {state.message}
    </p>
  );
}
