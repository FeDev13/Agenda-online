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
        <h1 id="error-title">Something went wrong</h1>
        <p>{error.message || "The request could not be completed."}</p>
        <button className="button" onClick={() => reset()} type="button">
          Try again
        </button>
      </section>
    </main>
  );
}
