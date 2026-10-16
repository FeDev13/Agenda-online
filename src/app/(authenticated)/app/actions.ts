"use server";

import { redirect } from "next/navigation";

import { toUserMessage } from "@/lib/server/errors";

import { hideScheduleItemSchema } from "@/features/cases/validation";
import { hideScheduleItem } from "@/lib/server/scheduling";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export async function hideScheduleItemAction(formData: FormData) {
  const parsed = hideScheduleItemSchema.safeParse({
    id: formData.get("id"),
    kind: formData.get("kind")
  });

  if (!parsed.success) {
    return { ok: false, message: "Revisá los datos e intentá nuevamente." };
  }

  try {
    await hideScheduleItem(parsed.data);
    return { ok: true, message: "Entrada ocultada para el estudio." };
  } catch (error) {
    return { ok: false, message: toUserMessage(error) };
  }
}
