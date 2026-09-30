import { z } from "zod";

export const passwordResetRequestSchema = z.object({
  email: z.email("Ingresá un email válido.").trim().toLowerCase()
});

export const passwordUpdateSchema = z
  .object({
    confirmPassword: z.string(),
    password: z
      .string()
      .min(12, "La contraseña debe tener al menos 12 caracteres.")
      .regex(/[a-z]/, "La contraseña debe incluir minúsculas.")
      .regex(/[A-Z]/, "La contraseña debe incluir mayúsculas.")
      .regex(/[0-9]/, "La contraseña debe incluir números.")
      .regex(/[^A-Za-z0-9]/, "La contraseña debe incluir símbolos.")
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"]
  });

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
