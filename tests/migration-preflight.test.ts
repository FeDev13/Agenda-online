import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertMigrationsApplied } from "../scripts/migration-status";

const versions = readdirSync("supabase/migrations")
  .filter((name) => name.endsWith(".sql"))
  .map((name) => name.split("_")[0]!)
  .filter(Boolean);

describe("linked database release preflight", () => {
  it("accepts fully applied migration histories in JSON and table formats", () => {
    const json = JSON.stringify({
      migrations: versions.map((version) => ({ local: version, remote: version }))
    });
    const table = `Local | Remote | Time\n${versions.map((version) => `\`${version}\` | \`${version}\` | ${version}`).join("\n")}`;
    expect(() => assertMigrationsApplied(json, versions)).not.toThrow();
    expect(() => assertMigrationsApplied(table, versions)).not.toThrow();
  });
  it("blocks the missing deadline migration that broke deployed pages", () => {
    const output = JSON.stringify({
      migrations: versions.map((version) => ({
        local: version,
        remote: version === "202610160001" ? "" : version
      }))
    });
    expect(() => assertMigrationsApplied(output, versions)).toThrow("202610160001");
  });
  it("fails closed on missing, malformed, or divergent histories", () => {
    for (const output of [
      "",
      "permission denied",
      JSON.stringify({ migrations: [] }),
      JSON.stringify({
        migrations: [
          ...versions.map((version) => ({ local: version, remote: version })),
          { local: "", remote: "209901010001" }
        ]
      })
    ])
      expect(() => assertMigrationsApplied(output, versions)).toThrow();
  });
});
