import "server-only";

import { revalidatePath } from "next/cache";
import { feeEstimateSchema } from "@/features/honorarios/validation";
import { canManageCases } from "@/lib/domain/authorization";
import { requireActiveMembership, requireMfaVerified } from "@/lib/server/auth";
import { UserFacingError } from "@/lib/server/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listHonorarios() {
  await requireMfaVerified("/app/honorarios");
  const { membership } = await requireActiveMembership();
  const supabase = await createSupabaseServerClient();
  // Fetch every page so Supabase's response cap cannot silently understate totals.
  const cases: Array<{ id: string; case_number: string; title: string; status: string }> =
    [];
  const estimates: Array<{
    case_id: string;
    currency: string;
    amount_cents: number;
    revision: number;
  }> = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("cases")
      .select("id,case_number,title,status")
      .eq("firm_id", membership.firmId)
      .order("case_number")
      .order("id")
      .range(offset, offset + 499);
    if (error) throw new UserFacingError("No se pudieron cargar los honorarios.");
    cases.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("case_fee_estimates")
      .select("case_id,currency,amount_cents,revision")
      .eq("firm_id", membership.firmId)
      .order("id")
      .range(offset, offset + 499);
    if (error) throw new UserFacingError("No se pudieron cargar los honorarios.");
    estimates.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  return { cases, estimates, canManage: canManageCases(membership.role) };
}

export async function saveFeeEstimate(input: unknown) {
  const parsed = feeEstimateSchema.safeParse(input);
  if (!parsed.success)
    throw new UserFacingError(parsed.error.issues[0]?.message ?? "Revisá el importe.");
  await requireMfaVerified("/app/honorarios");
  const { membership } = await requireActiveMembership();
  if (!canManageCases(membership.role))
    throw new UserFacingError("No se pudo guardar el honorario.");
  const supabase = await createSupabaseServerClient();
  const { caseId, currency, amount, expectedRevision } = parsed.data;
  const { error } = await supabase.rpc("set_case_fee_estimate", {
    p_case_id: caseId,
    p_currency: currency,
    p_amount_cents: amount,
    p_expected_revision: expectedRevision
  });
  if (error)
    throw new UserFacingError(
      error.code === "40001"
        ? "El honorario cambió. Recargá la página antes de guardar nuevamente."
        : "No se pudo guardar el honorario."
    );
  revalidatePath("/app/honorarios");
  revalidatePath("/app");
  revalidatePath("/app/cases");
}
