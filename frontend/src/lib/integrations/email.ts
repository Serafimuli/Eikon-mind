import "server-only";

export { sendOperationsEmail, sendTransactionalEmail } from "@/lib/integrations/email-delivery";

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
