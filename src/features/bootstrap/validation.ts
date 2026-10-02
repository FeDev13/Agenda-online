import { z } from "zod";

export const bootstrapFirmSchema = z.object({
  adminDisplayName: z
    .string()
    .trim()
    .max(120, "El nombre visible es demasiado largo.")
    .optional()
    .transform((value) => (value ? value : null)),
  adminEmail: z.email("Ingresá un email administrador válido.").trim().toLowerCase(),
  bootstrapToken: z.string().min(1, "Ingresá el token de bootstrap."),
  defaultTimezone: z
    .string()
    .trim()
    .min(1, "Ingresá una zona horaria.")
    .max(80, "La zona horaria es demasiado larga.")
    .default("America/Argentina/Buenos_Aires"),
  firmName: z
    .string()
    .trim()
    .min(1, "Ingresá el nombre del estudio.")
    .max(160, "El nombre del estudio es demasiado largo.")
});

export type BootstrapFirmInput = z.infer<typeof bootstrapFirmSchema>;
