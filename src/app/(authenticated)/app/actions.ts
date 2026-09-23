"use server";

import { redirect } from "next/navigation";

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
    return;
  }

  await hideScheduleItem(parsed.data);
}
