import "server-only";

type ResendEmailInput = {
  from: string;
  html: string;
  idempotencyKey: string;
  replyTo?: string;
  subject: string;
  tags?: Array<{ name: string; value: string }>;
  text: string;
  to: string;
};

type ResendEmailResult = {
  id: string;
};

export async function sendResendEmail({
  apiKey,
  email
}: {
  apiKey: string;
  email: ResendEmailInput;
}): Promise<ResendEmailResult> {
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: email.from,
      html: email.html,
      reply_to: email.replyTo,
      subject: email.subject,
      tags: email.tags,
      text: email.text,
      to: [email.to]
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": email.idempotencyKey
    },
    method: "POST"
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(extractResendError(payload) ?? `Resend failed: ${response.status}`);
  }

  const id = extractResendId(payload);

  if (!id) {
    throw new Error("Resend did not return a message id.");
  }

  return { id };
}

function extractResendId(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    typeof payload.id === "string"
  ) {
    return payload.id;
  }

  return null;
}

function extractResendError(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  if ("error" in payload && typeof payload.error === "string") {
    return payload.error;
  }

  return null;
}
