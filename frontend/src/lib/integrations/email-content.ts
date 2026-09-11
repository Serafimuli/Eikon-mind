import type { TransactionalEmailMessage } from "@/lib/integrations/email-message";

export function securityEmail(kind: "verify" | "reset", url: string): TransactionalEmailMessage {
  if (kind === "verify") {
    return {
      subject: "Verify your Eikon Mind email address",
      body: "Use the secure link below to verify your email address. If you did not create an account, you can ignore this email.",
      action: { label: "Verify email address", url },
    };
  }
  return {
    subject: "Reset your Eikon Mind password",
    body: "Use the secure link below to set a new password. If you did not request this, you can ignore this email.",
    action: { label: "Reset password", url },
  };
}

export function passwordChangedEmail(): TransactionalEmailMessage {
  return {
    subject: "Your Eikon Mind password was updated",
    body: "Your Eikon Mind password was updated. If you did not make this change, reset your password immediately or contact Eikon Mind support.",
  };
}

export function appointmentEmail(
  kind: "confirmed" | "cancelled" | "requested",
): TransactionalEmailMessage {
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
