import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/types/database";

vi.mock("server-only", () => ({}));
import { runDeadlineAlertJobWithClients } from "@/lib/server/deadline-alert-job";

function fixture({ resolvedInitially = false, resolvedDuringSend = false } = {}) {
  const deliveryUpdates: string[] = [];
  const fakeFetch: typeof fetch = async (input, options) => {
    const url = new URL(String(input));
    const table = url.pathname.split("/").at(-1);
    const json = (data: unknown) =>
      new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" }
      });
    if (table === "firms")
      return json([{ id: "firm", default_timezone: "America/Argentina/Buenos_Aires" }]);
    if (table === "case_deadlines") {
      expect(url.searchParams.get("status")).toBe("eq.pending");
      if (resolvedInitially || (resolvedDuringSend && url.searchParams.has("id")))
        return json([]);
      return json([
        { id: "deadline", firm_id: "firm", case_id: "case", due_on: "2026-10-08" }
      ]);
    }
    if (table === "tasks" || table === "case_members") return json([]);
    if (table === "firm_memberships")
      return json([{ profile_id: "admin", role: "admin" }]);
    if (table === "profiles")
      return json([
        { id: "admin", email: "admin@example.test", display_name: "Synthetic admin" }
      ]);
    if (table === "notification_deliveries") {
      if (options?.method === "POST")
        return json({ id: "delivery", status: "pending", attempt_count: 0 });
      if (options?.method === "PATCH") {
        const body = JSON.parse(String(options.body)) as { status: string };
        deliveryUpdates.push(body.status);
        return new Response(null, { status: 204 });
      }
      return json([]);
    }
    throw new Error(`Unexpected test endpoint ${table}`);
  };
  const supabase = createClient<Database>(
    "https://synthetic.example.test",
    "synthetic-key",
    {
      global: { fetch: fakeFetch },
      auth: { persistSession: false, autoRefreshToken: false }
    }
  );
  const sendEmail = vi.fn(async () => ({ id: "synthetic-email" }));
  return { supabase, sendEmail, deliveryUpdates };
}

describe("deadline alert lifecycle", () => {
  it("sends alerts for pending deadlines", async () => {
    const dependencies = fixture();
    const result = await runDeadlineAlertJobWithClients({
      ...dependencies,
      dryRun: false,
      now: new Date("2026-10-01T12:00:00Z")
    });
    expect(result.sent).toBe(1);
    expect(dependencies.sendEmail).toHaveBeenCalledOnce();
    expect(dependencies.deliveryUpdates).toEqual(["pending", "sent"]);
  });
  it("excludes deadlines already resolved before candidate selection", async () => {
    const dependencies = fixture({ resolvedInitially: true });
    const result = await runDeadlineAlertJobWithClients({
      ...dependencies,
      dryRun: false,
      now: new Date("2026-10-01T12:00:00Z")
    });
    expect(result.candidates).toBe(0);
    expect(dependencies.sendEmail).not.toHaveBeenCalled();
  });
  it("skips a deadline resolved after candidate selection and before sending", async () => {
    const dependencies = fixture({ resolvedDuringSend: true });
    const result = await runDeadlineAlertJobWithClients({
      ...dependencies,
      dryRun: false,
      now: new Date("2026-10-01T12:00:00Z")
    });
    expect(result.skipped).toBe(1);
    expect(dependencies.sendEmail).not.toHaveBeenCalled();
    expect(dependencies.deliveryUpdates).toEqual(["pending", "skipped"]);
  });
});
