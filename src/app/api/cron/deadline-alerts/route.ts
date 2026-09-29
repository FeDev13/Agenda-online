import { timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";

import { getDeadlineAlertEnv } from "@/lib/env";
import { runDeadlineAlertJob } from "@/lib/server/deadline-alert-job";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let env: ReturnType<typeof getDeadlineAlertEnv>;

  try {
    env = getDeadlineAlertEnv();
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Email alerts not configured." },
      { status: 503 }
    );
  }

  if (!isAuthorizedCronRequest(request, env.DEADLINE_ALERT_CRON_SECRET)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const summary = await runDeadlineAlertJob({ dryRun });

  return Response.json({ dryRun, ok: true, summary });
}

function isAuthorizedCronRequest(request: NextRequest, expectedSecret: string) {
  const headerSecret =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!headerSecret) {
    return false;
  }

  const expected = Buffer.from(expectedSecret);
  const received = Buffer.from(headerSecret);

  return expected.length === received.length && timingSafeEqual(expected, received);
}
