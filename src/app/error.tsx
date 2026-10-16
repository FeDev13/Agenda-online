"use client";

export default function RootError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="error-title">
        <h1 id="error-title">Algo salió mal</h1>
        <p>No se pudo completar la solicitud. Intentá nuevamente o volvé al inicio.</p>
        <button className="button" onClick={() => reset()} type="button">
          Intentar nuevamente
        </button>
        <a className="textLink" href="/app">
          Volver al inicio
        </a>
      </section>
    </main>
  );
}
