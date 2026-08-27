import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202608270001_initial_schema.sql"),
  "utf8"
);

const firmOwnedTables = [
  "firms",
  "profiles",
  "firm_memberships",
  "clients",
  "cases",
  "case_members",
  "events",
  "case_deadlines",
  "tasks",
  "reminders",
  "notes",
  "documents",
  "audit_log"
];

describe("initial Supabase migration security posture", () => {
  it("enables and forces RLS on every exposed core table", () => {
    for (const table of firmOwnedTables) {
      expect(migration).toContain(
        `alter table public.${table} enable row level security;`
      );
      expect(migration).toContain(
        `alter table public.${table} force row level security;`
      );
    }
  });

  it("does not grant authenticated or anonymous users hard-delete privileges", () => {
    expect(migration).not.toMatch(/grant\s+[^;]*delete[^;]*\s+to authenticated/i);
    expect(migration).not.toMatch(/grant\s+[^;]*delete[^;]*\s+to anon/i);
  });

  it("explicitly avoids anonymous table and routine access", () => {
    expect(migration).toContain("revoke all on schema public from anon;");
    expect(migration).toContain("revoke all on all tables in schema public from anon;");
    expect(migration).toContain(
      "revoke all on all routines in schema public from public;"
    );
    expect(migration).not.toMatch(/grant\s+[^;]+\s+to anon/i);
  });

  it("contains explicit cross-firm and case-assignment RLS helpers", () => {
    expect(migration).toContain("public.is_active_firm_member(target_firm_id)");
    expect(migration).toContain("public.can_access_case(");
    expect(migration).toContain("members.profile_id = auth.uid()");
  });

  it("prevents read-only users from mutating case work records", () => {
    for (const table of ["tasks", "reminders", "notes", "documents"]) {
      const policyStart = migration.indexOf(` on public.${table}`);
      expect(policyStart).toBeGreaterThan(-1);
    }

    expect(migration).toMatch(
      /create policy "authorized users can manage tasks"[\s\S]*public\.has_firm_role\(firm_id, array\['admin', 'lawyer', 'paralegal'\]/
    );
    expect(migration).toMatch(
      /create policy "authorized users can create notes"[\s\S]*public\.has_firm_role\(firm_id, array\['admin', 'lawyer', 'paralegal'\]/
    );
    expect(migration).toMatch(
      /create policy "authorized users can create document metadata"[\s\S]*public\.has_firm_role\(firm_id, array\['admin', 'lawyer', 'paralegal'\]/
    );
  });

  it("configures the case document bucket as private", () => {
    expect(migration).toContain("'case-documents'");
    expect(migration).toContain("false,");
    expect(migration).toContain("case documents can be read by authorized case users");
    expect(migration).toContain(
      "case documents can be uploaded by authorized case users"
    );
    expect(migration).toMatch(
      /on storage\.objects for insert to authenticated[\s\S]*owner = auth\.uid\(\)/
    );
    expect(migration).toContain("array['admin', 'lawyer', 'paralegal']");
  });
});
