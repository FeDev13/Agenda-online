type MigrationRow = { local: string; remote: string };

function readMigrationRows(output: string): MigrationRow[] {
  // CLI versions expose either a JSON result or a migration comparison table.
  for (const line of [output.trim(), ...output.split("\n")]) {
    try {
      const payload: unknown = JSON.parse(line);
      const rows = Array.isArray(payload)
        ? payload
        : payload && typeof payload === "object" && "migrations" in payload
          ? payload.migrations
          : null;
      if (
        Array.isArray(rows) &&
        rows.every((row: unknown) => {
          if (!row || typeof row !== "object" || !("local" in row) || !("remote" in row))
            return false;
          return (
            (typeof row.local === "string" || row.local === null) &&
            (typeof row.remote === "string" || row.remote === null)
          );
        })
      )
        return (rows as Array<{ local: string | null; remote: string | null }>).map(
          ({ local, remote }) => ({ local: local ?? "", remote: remote ?? "" })
        );
    } catch {
      /* Try the next line or the table representation. */
    }
  }
  return output
    .split("\n")
    .filter((line) => line.includes("|"))
    .map((line) => {
      const [local = "", remote = ""] = line
        .split("|")
        .map((cell) => cell.replaceAll("`", "").trim());
      return { local, remote };
    })
    .filter(
      ({ local, remote }) => /^\d{12,14}$/.test(local) || /^\d{12,14}$/.test(remote)
    );
}

export function assertMigrationsApplied(output: string, expected: string[]) {
  const rows = readMigrationRows(output);
  const localVersions = rows.map((row) => row.local).filter(Boolean);
  if (
    localVersions.length !== expected.length ||
    expected.some((version) => !localVersions.includes(version))
  )
    throw new Error(
      "Could not verify the full migration history. Deployment must wait for a successful check."
    );
  const mismatches = rows.filter(({ local, remote }) => local !== remote);
  if (mismatches.length)
    throw new Error(
      `Database migrations do not match this release: ${mismatches.map(({ local, remote }) => local || remote).join(", ")}. Apply and verify migrations before deploying the application.`
    );
}
