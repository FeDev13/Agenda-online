import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1)
});

const serviceRoleEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

const deadlineAlertEnvSchema = serviceRoleEnvSchema.extend({
  APP_BASE_URL: z.string().url(),
  DEADLINE_ALERT_CRON_SECRET: z.string().min(24),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().min(1),
  RESEND_REPLY_TO_EMAIL: z.string().min(1).optional()
});

export function getPublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  });

  if (!parsed.success) {
    throw new Error(
      "Faltan las variables de entorno de Supabase. Copiá .env.example a .env.local y configurá la URL pública del proyecto y la clave publicable."
    );
  }

  return parsed.data;
}

export function getServiceRoleEnv() {
  const parsed = serviceRoleEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  if (!parsed.success) {
    throw new Error(
      "Faltan las variables server-only de Supabase. Configurá SUPABASE_SERVICE_ROLE_KEY solo en el entorno del servidor."
    );
  }

  return parsed.data;
}

export function getDeadlineAlertEnv() {
  const parsed = deadlineAlertEnvSchema.safeParse({
    APP_BASE_URL: process.env.APP_BASE_URL,
    DEADLINE_ALERT_CRON_SECRET: process.env.DEADLINE_ALERT_CRON_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_REPLY_TO_EMAIL: process.env.RESEND_REPLY_TO_EMAIL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  if (!parsed.success) {
    throw new Error(
      "Faltan variables para alertas por email. Configurá APP_BASE_URL, DEADLINE_ALERT_CRON_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL y SUPABASE_SERVICE_ROLE_KEY en el servidor."
    );
  }

  return parsed.data;
}
