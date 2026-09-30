import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { UpdatePasswordForm } from "./update-password-form";

export default async function UpdatePasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/reset-password");
  }

  return (
    <main className="authPage">
      <section className="authPanel" aria-labelledby="update-password-title">
        <h1 id="update-password-title">Actualizar contraseña</h1>
        <p>Elegí una contraseña nueva para volver a ingresar.</p>
        <UpdatePasswordForm />
      </section>
    </main>
  );
}
