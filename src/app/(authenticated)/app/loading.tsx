export default function Loading() {
  return (
    <section className="panel loadingPanel" aria-busy="true" role="status">
      <h1>Cargando…</h1>
      <p className="muted">Estamos preparando la información.</p>
    </section>
  );
}
