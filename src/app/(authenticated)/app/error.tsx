"use client";

import Link from "next/link";
import { Button } from "@/components/button";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <section className="panel" aria-labelledby="request-error-title">
      <h1 id="request-error-title">No pudimos cargar esta información</h1>
      <p className="muted">
        Intentá nuevamente. Si el problema continúa, consultá con la administración del
        estudio.
      </p>
      <div className="inlineForm startActions">
        <Button onClick={reset}>Intentar nuevamente</Button>
        <Link className="secondaryButton" href="/app">
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}
