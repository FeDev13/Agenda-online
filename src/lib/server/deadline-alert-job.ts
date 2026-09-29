import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildDeadlineAlertEmail,
  buildDeadlineAlertIdempotencyKey,
  getAuthorizedDeadlineAlertRecipients,
  getDeadlineAlertTargetDates,
  getDeadlineAlertWindow,
  type DeadlineAlertRecipient,
  type DeadlineAlertScheduleItem
} from "@/lib/deadline-alerts";
import { getDeadlineAlertEnv } from "@/lib/env";
import { sendResendEmail } from "@/lib/server/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Database,
  FirmRole,
  NotificationAlertWindow,
  NotificationDeliveryStatus
} from "@/types/database";

type FirmRow = {
  default_timezone: string;
  id: string;
};

type DeadlineRow = {
  case_id: string;
  due_on: string;
  firm_id: string;
  id: string;
};

type TaskRow = {
  case_id: string;
  due_on: string | null;
  firm_id: string;
  id: string;
};

type MembershipRow = {
  profile_id: string;
  role: FirmRole;
};

type ProfileRow = {
  display_name: string | null;
  email: string;
  id: string;
};

type CaseMemberRow = {
  case_id: string;
  profile_id: string;
};

type DeliveryRow = {
  attempt_count: number;
  id: string;
  status: NotificationDeliveryStatus;
};

type DeadlineAlertCandidate = {
  item: DeadlineAlertScheduleItem;
  recipient: DeadlineAlertRecipient;
  window: NotificationAlertWindow;
};

type DeadlineAlertEnv = ReturnType<typeof getDeadlineAlertEnv>;

const maxAttempts = 3;

export async function runDeadlineAlertJob({
  dryRun = false,
  now = new Date()
}: {
  dryRun?: boolean;
  now?: Date;
} = {}) {
  const env = getDeadlineAlertEnv();
  const supabase = createSupabaseAdminClient();

  return runDeadlineAlertJobWithClients({
    dryRun,
    now,
    sendEmail: (candidate) => sendDeadlineAlertEmail(env, candidate),
    supabase
  });
}

export async function runDeadlineAlertJobWithClients({
  dryRun,
  now,
  sendEmail,
  supabase
}: {
  dryRun: boolean;
  now: Date;
  sendEmail: (candidate: DeadlineAlertCandidate) => Promise<{ id: string }>;
  supabase: SupabaseClient<Database>;
}) {
  const firms = await listFirms(supabase);
  const summary = {
    candidates: 0,
    failed: 0,
    sent: 0,
    skipped: 0
  };

  for (const firm of firms) {
    const candidates = await listFirmAlertCandidates(supabase, firm, now);
    summary.candidates += candidates.length;

    for (const candidate of candidates) {
      if (dryRun) {
        summary.skipped += 1;
        continue;
      }

      const result = await sendCandidateAlert(supabase, candidate, sendEmail);
      summary[result] += 1;
    }
  }

  return summary;
}

async function listFirms(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.from("firms").select("id,default_timezone");

  if (error) {
    throw new Error("No se pudieron cargar los estudios para alertas.");
  }

  return (data ?? []) as FirmRow[];
}

async function listFirmAlertCandidates(
  supabase: SupabaseClient<Database>,
  firm: FirmRow,
  now: Date
) {
  const targetDates = [
    ...new Set(
      getDeadlineAlertTargetDates(now, firm.default_timezone).map(
        (target) => target.dueOn
      )
    )
  ];

  const [deadlines, tasks] = await Promise.all([
    listFirmDeadlines(supabase, firm.id, targetDates),
    listFirmTasks(supabase, firm.id, targetDates)
  ]);

  const items: DeadlineAlertScheduleItem[] = [
    ...deadlines.map((deadline) => ({
      caseId: deadline.case_id,
      dueOn: deadline.due_on,
      firmId: deadline.firm_id,
      id: deadline.id,
      kind: "deadline" as const
    })),
    ...tasks
      .filter((task): task is TaskRow & { due_on: string } => task.due_on !== null)
      .map((task) => ({
        caseId: task.case_id,
        dueOn: task.due_on,
        firmId: task.firm_id,
        id: task.id,
        kind: "task" as const
      }))
  ];

  if (items.length === 0) {
    return [];
  }

  const caseIds = [...new Set(items.map((item) => item.caseId))];
  const [recipients, caseMembers] = await Promise.all([
    listFirmRecipients(supabase, firm.id),
    listCaseMembers(supabase, firm.id, caseIds)
  ]);
  const caseMemberMap = new Map<string, Set<string>>();

  for (const caseMember of caseMembers) {
    const profileIds = caseMemberMap.get(caseMember.case_id) ?? new Set<string>();
    profileIds.add(caseMember.profile_id);
    caseMemberMap.set(caseMember.case_id, profileIds);
  }

  return items.flatMap((item) => {
    const window = getDeadlineAlertWindow(item.dueOn, now, firm.default_timezone);

    if (!window) {
      return [];
    }

    const authorizedRecipients = getAuthorizedDeadlineAlertRecipients({
      caseMemberProfileIds: caseMemberMap.get(item.caseId) ?? new Set<string>(),
      recipients
    });

    return authorizedRecipients.map((recipient) => ({ item, recipient, window }));
  });
}

async function listFirmDeadlines(
  supabase: SupabaseClient<Database>,
  firmId: string,
  targetDates: string[]
) {
  const { data, error } = await supabase
    .from("case_deadlines")
    .select("id,firm_id,case_id,due_on")
    .eq("firm_id", firmId)
    .is("hidden_at", null)
    .in("due_on", targetDates);

  if (error) {
    throw new Error("No se pudieron cargar los vencimientos para alertas.");
  }

  return (data ?? []) as DeadlineRow[];
}

async function listFirmTasks(
  supabase: SupabaseClient<Database>,
  firmId: string,
  targetDates: string[]
) {
  const { data, error } = await supabase
    .from("tasks")
    .select("id,firm_id,case_id,due_on")
    .eq("firm_id", firmId)
    .eq("status", "open")
    .not("due_on", "is", null)
    .in("due_on", targetDates);

  if (error) {
    throw new Error("No se pudieron cargar las tareas para alertas.");
  }

  return (data ?? []) as TaskRow[];
}

async function listFirmRecipients(
  supabase: SupabaseClient<Database>,
  firmId: string
): Promise<DeadlineAlertRecipient[]> {
  const { data: memberships, error: membershipsError } = await supabase
    .from("firm_memberships")
    .select("profile_id,role")
    .eq("firm_id", firmId)
    .eq("status", "active");

  if (membershipsError) {
    throw new Error("No se pudieron cargar destinatarios de alertas.");
  }

  const membershipRows = (memberships ?? []) as MembershipRow[];
  const profileIds = membershipRows.map((membership) => membership.profile_id);

  if (profileIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,email,display_name")
    .in("id", profileIds);

  if (profilesError) {
    throw new Error("No se pudieron cargar perfiles de alertas.");
  }

  const profilesById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile])
  );

  return membershipRows.flatMap((membership) => {
    const profile = profilesById.get(membership.profile_id);

    if (!profile) {
      return [];
    }

    return [
      {
        displayName: profile.display_name,
        email: profile.email,
        profileId: membership.profile_id,
        role: membership.role
      }
    ];
  });
}

async function listCaseMembers(
  supabase: SupabaseClient<Database>,
  firmId: string,
  caseIds: string[]
) {
  const { data, error } = await supabase
    .from("case_members")
    .select("case_id,profile_id")
    .eq("firm_id", firmId)
    .in("case_id", caseIds);

  if (error) {
    throw new Error("No se pudieron cargar integrantes de causas para alertas.");
  }

  return (data ?? []) as CaseMemberRow[];
}

async function sendCandidateAlert(
  supabase: SupabaseClient<Database>,
  candidate: DeadlineAlertCandidate,
  sendEmail: (candidate: DeadlineAlertCandidate) => Promise<{ id: string }>
): Promise<"failed" | "sent" | "skipped"> {
  const delivery = await findOrCreateDelivery(supabase, candidate);

  if (delivery.status === "sent") {
    return "skipped";
  }

  if (delivery.status === "failed" && delivery.attempt_count >= maxAttempts) {
    return "skipped";
  }

  const attemptCount = delivery.attempt_count + 1;
  await markDeliveryPending(supabase, delivery.id, attemptCount);

  try {
    const result = await sendEmail(candidate);
    await markDeliverySent(supabase, delivery.id, result.id);

    return "sent";
  } catch (error) {
    await markDeliveryFailed(supabase, delivery.id, attemptCount, getErrorMessage(error));

    return "failed";
  }
}

async function findOrCreateDelivery(
  supabase: SupabaseClient<Database>,
  candidate: DeadlineAlertCandidate
) {
  const match = {
    alert_window: candidate.window,
    channel: "email" as const,
    recipient_profile_id: candidate.recipient.profileId,
    schedule_item_id: candidate.item.id,
    schedule_item_kind: candidate.item.kind
  };
  const { data: existing, error: existingError } = await supabase
    .from("notification_deliveries")
    .select("id,status,attempt_count")
    .match(match)
    .maybeSingle();

  if (existingError) {
    throw new Error("No se pudo leer el estado de alerta por email.");
  }

  if (existing) {
    return existing as DeliveryRow;
  }

  const { data: created, error: createError } = await supabase
    .from("notification_deliveries")
    .insert({
      alert_window: candidate.window,
      case_id: candidate.item.caseId,
      firm_id: candidate.item.firmId,
      recipient_email: candidate.recipient.email,
      recipient_profile_id: candidate.recipient.profileId,
      schedule_item_id: candidate.item.id,
      schedule_item_kind: candidate.item.kind
    })
    .select("id,status,attempt_count")
    .single();

  if (createError || !created) {
    throw new Error("No se pudo preparar la alerta por email.");
  }

  return created as DeliveryRow;
}

async function markDeliveryPending(
  supabase: SupabaseClient<Database>,
  deliveryId: string,
  attemptCount: number
) {
  const { error } = await supabase
    .from("notification_deliveries")
    .update({
      attempt_count: attemptCount,
      last_error: null,
      status: "pending"
    })
    .eq("id", deliveryId);

  if (error) {
    throw new Error("No se pudo marcar la alerta como pendiente.");
  }
}

async function markDeliverySent(
  supabase: SupabaseClient<Database>,
  deliveryId: string,
  providerMessageId: string
) {
  const { error } = await supabase
    .from("notification_deliveries")
    .update({
      last_error: null,
      provider_message_id: providerMessageId,
      sent_at: new Date().toISOString(),
      status: "sent"
    })
    .eq("id", deliveryId);

  if (error) {
    throw new Error("No se pudo registrar el envio de alerta.");
  }
}

async function markDeliveryFailed(
  supabase: SupabaseClient<Database>,
  deliveryId: string,
  attemptCount: number,
  message: string
) {
  const { error } = await supabase
    .from("notification_deliveries")
    .update({
      attempt_count: attemptCount,
      last_error: message.slice(0, 500),
      status: "failed"
    })
    .eq("id", deliveryId);

  if (error) {
    throw new Error("No se pudo registrar el fallo de alerta.");
  }
}

async function sendDeadlineAlertEmail(
  env: DeadlineAlertEnv,
  candidate: DeadlineAlertCandidate
) {
  const email = buildDeadlineAlertEmail({
    appBaseUrl: env.APP_BASE_URL,
    dueOn: candidate.item.dueOn,
    window: candidate.window
  });

  return sendResendEmail({
    apiKey: env.RESEND_API_KEY,
    email: {
      from: env.RESEND_FROM_EMAIL,
      html: email.html,
      idempotencyKey: buildDeadlineAlertIdempotencyKey({
        recipientProfileId: candidate.recipient.profileId,
        scheduleItemId: candidate.item.id,
        scheduleItemKind: candidate.item.kind,
        window: candidate.window
      }),
      replyTo: env.RESEND_REPLY_TO_EMAIL,
      subject: email.subject,
      tags: [
        { name: "type", value: "deadline-alert" },
        { name: "window", value: candidate.window },
        { name: "kind", value: candidate.item.kind }
      ],
      text: email.text,
      to: candidate.recipient.email
    }
  });
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido al enviar email.";
}
