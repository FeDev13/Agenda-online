import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationsPath = join(process.cwd(), "supabase/migrations");
const migration = readdirSync(migrationsPath)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort()
  .map((fileName) => readFileSync(join(migrationsPath, fileName), "utf8"))
  .join("\n");

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

  it("limits hard-delete privileges to case assignment edges", () => {
    const migrationWithoutAssignmentGrant = migration.replace(
      "grant select, insert, update, delete on public.case_members to authenticated;",
      ""
    );

    expect(migration).toContain(
      "grant select, insert, update, delete on public.case_members to authenticated;"
    );
    expect(migrationWithoutAssignmentGrant).not.toMatch(
      /grant\s+[^;]*delete[^;]*\s+to authenticated/i
    );
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

  it("keeps case archival behind an admin-only database boundary", () => {
    expect(migration).toContain("create or replace function public.archive_case");
    expect(migration).toContain("public.enforce_case_archive_admin()");
    expect(migration).toContain("new.status = 'archived'");
    expect(migration).toContain("array['admin']::public.firm_role[]");
    expect(migration).toContain("'case.archived'");
    expect(migration).toContain("grant execute on function public.archive_case(uuid)");
  });

  it("keeps schedule hiding non-destructive and audited", () => {
    expect(migration).toContain("add column if not exists hidden_at timestamptz");
    expect(migration).toContain("create or replace function public.hide_schedule_item");
    expect(migration).toContain("'event.hidden'");
    expect(migration).toContain("'deadline.hidden'");
    expect(migration).toContain(
      "revoke all on function public.hide_schedule_item(text, uuid) from public"
    );
    expect(migration).toContain(
      "grant execute on function public.hide_schedule_item(text, uuid) to authenticated"
    );
    expect(migration).not.toMatch(/delete\s+from\s+public\.(events|case_deadlines)/i);
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
