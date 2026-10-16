import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { assertMigrationsApplied } from "./migration-status.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const expected = readdirSync(new URL("../supabase/migrations/", import.meta.url))
  .filter((name) => name.endsWith(".sql"))
  .map((name) => name.split("_")[0]);

try {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(
        new URL("../node_modules/supabase/dist/supabase.js", import.meta.url)
      ),
      "migration",
      "list",
      "--linked"
    ],
    { cwd: root, encoding: "utf8", timeout: 120000 }
  );
  if (result.error || result.status !== 0)
    throw new Error(
      "Could not check linked migrations. Verify Supabase login and project linkage."
    );
  assertMigrationsApplied(result.stdout, expected);
  console.log("Linked database migrations match this release.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Migration preflight failed.");
  process.exitCode = 1;
}
