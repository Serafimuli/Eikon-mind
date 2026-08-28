import "server-only";

import { createTextEmail } from "@/lib/integrations/email-message";

async function sendEmail(
  binding: SendEmail,
  from: string,
  to: string,
  subject: string,
  body: string,
) {
  const message = createTextEmail(from, to, subject, body);
  await binding.send(message);
}

export function sendTransactionalEmail(
  env: Pick<CloudflareEnv, "TRANSACTIONAL_EMAIL" | "EMAIL_FROM_ADDRESS">,
  recipient: string,
  subject: string,
  body: string,
) {
  return sendEmail(env.TRANSACTIONAL_EMAIL, env.EMAIL_FROM_ADDRESS, recipient, subject, body);
}

export function sendOperationsEmail(
  env: Pick<CloudflareEnv, "OPERATIONS_EMAIL" | "EMAIL_FROM_ADDRESS" | "OPERATIONS_MAILBOX">,
  subject: string,
  body: string,
) {
  return sendEmail(
    env.OPERATIONS_EMAIL,
    env.EMAIL_FROM_ADDRESS,
    env.OPERATIONS_MAILBOX,
    subject,
    body,
  );
}

export function securityEmail(kind: "verify" | "reset", url: string) {
  if (kind === "verify") {
    return {
      subject: "Verify your Eikon Mind email address",
      body: `Open this link to verify your email address:\n${url}\n\nIf you did not create an account, you can ignore this email.`,
    };
  }
  return {
    subject: "Reset your Eikon Mind password",
    body: `Open this link to set a new password:\n${url}\n\nIf you did not request this, you can ignore this email.`,
  };
}

export function appointmentEmail(kind: "confirmed" | "cancelled" | "requested") {
  if (kind === "confirmed") {
    return {
      subject: "Eikon Mind appointment confirmed",
      body: "Your appointment has been confirmed. Sign in to view your appointment details.",
    };
  }
  if (kind === "requested") {
    return {
      subject: "New Eikon Mind appointment request",
      body: "A new appointment request is available. Sign in to review it.",
    };
  }
  return {
    subject: "Eikon Mind appointment cancelled",
    body: "Your appointment has been cancelled. Sign in to view your appointment details.",
  };
}
