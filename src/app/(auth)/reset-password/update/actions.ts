"use server";

import { redirect } from "next/navigation";

import { passwordUpdateSchema } from "@/features/auth/password-recovery";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PasswordUpdateState = {
  message: string | null;
};

export async function updatePasswordAction(
  _state: PasswordUpdateState,
  formData: FormData
) {
  const parsed = passwordUpdateSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Revisá la contraseña."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    return {
      message: "No se pudo actualizar la contraseña. Solicitá un nuevo enlace."
    };
  }

  await supabase.auth.signOut();
  redirect("/sign-in");
}
