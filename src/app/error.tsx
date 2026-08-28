"use client";

export default function RootError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="error-title">
        <h1 id="error-title">Algo salió mal</h1>
        <p>{error.message || "No se pudo completar la solicitud."}</p>
        <button className="button" onClick={() => reset()} type="button">
          Intentar nuevamente
        </button>
      </section>
    </main>
  );
}
