import "server-only"

function headerValue(value: string) {
  return value.replace(/[\r\n]/g, " ").trim()
}

function safeAddress(value: string) {
  const address = headerValue(value).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) {
    throw new Error("Invalid email destination")
  }
  return address
}

export async function sendTransactionalEmail(
  env: Pick<CloudflareEnv, "TRANSACTIONAL_EMAIL" | "EMAIL_FROM_ADDRESS">,
  recipient: string,
  subject: string,
  body: string,
) {
  const to = safeAddress(recipient)
  const from = safeAddress(env.EMAIL_FROM_ADDRESS)
  const raw = [
    `From: Eikon Mind <${from}>`,
    `To: ${to}`,
    `Subject: ${headerValue(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
  ].join("\r\n")

  // Keep the Workers-only module dynamic so `next build` can analyse the route
  // in Node; OpenNext resolves this native module in the deployed Worker.
  const { EmailMessage } = await import("cloudflare:email")
  await env.TRANSACTIONAL_EMAIL.send(new EmailMessage(from, to, raw))
}

export async function sendOperationsEmail(
  env: Pick<CloudflareEnv, "OPERATIONS_EMAIL" | "EMAIL_FROM_ADDRESS" | "OPERATIONS_MAILBOX">,
  subject: string,
  body: string,
) {
  const to = safeAddress(env.OPERATIONS_MAILBOX)
  const from = safeAddress(env.EMAIL_FROM_ADDRESS)
  const raw = [
    `From: Eikon Mind <${from}>`,
    `To: ${to}`,
    `Subject: ${headerValue(subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].join("\r\n")
  const { EmailMessage } = await import("cloudflare:email")
  await env.OPERATIONS_EMAIL.send(new EmailMessage(from, to, raw))
}

export function securityEmail(kind: "verify" | "reset", url: string) {
  if (kind === "verify") {
    return {
      subject: "Verify your Eikon Mind email address",
      body: `Open this link to verify your email address:\n${url}\n\nIf you did not create an account, you can ignore this email.`,
    }
  }
  return {
    subject: "Reset your Eikon Mind password",
    body: `Open this link to set a new password:\n${url}\n\nIf you did not request this, you can ignore this email.`,
  }
}

export function appointmentEmail(kind: "confirmed" | "cancelled") {
  return kind === "confirmed"
    ? {
        subject: "Eikon Mind appointment confirmed",
        body: "Your appointment has been confirmed. Sign in to view your appointment details.",
      }
    : {
        subject: "Eikon Mind appointment cancelled",
        body: "Your appointment has been cancelled. Sign in to view your appointment details.",
      }
}
