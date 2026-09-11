function headerValue(value: string) {
  return value.replace(/[\r\n]/g, " ").trim();
}

function safeAddress(value: string) {
  const address = headerValue(value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) {
    throw new Error("Invalid email destination");
  }
  return address;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function safeActionUrl(value: string) {
  const url = new URL(value);
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
    throw new Error("Invalid email action URL");
  }
  return url.toString();
}

export type TransactionalEmailMessage = {
  subject: string;
  body: string;
  action?: { label: string; url: string };
};

export function createTextEmail(fromInput: string, toInput: string, subject: string, body: string) {
  const to = safeAddress(toInput);
  const from = safeAddress(fromInput);
  return {
    from: { email: from, name: "Eikon Mind" },
    to,
    subject: headerValue(subject),
    text: body,
  };
}

export function createBrandedEmail(
  fromInput: string,
  toInput: string,
  message: TransactionalEmailMessage,
  logoUrl: string,
) {
  const base = createTextEmail(fromInput, toInput, message.subject, message.body);
  const action = message.action
    ? { label: headerValue(message.action.label), url: safeActionUrl(message.action.url) }
    : null;
  const text = [
    "Eikon Mind",
    "",
    message.body,
    ...(action ? ["", `${action.label}: ${action.url}`] : []),
    "",
    "Eikon Mind · eikon-mind.ro",
  ].join("\n");
  const actionMarkup = action
    ? `<p style="margin:28px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#9f4d32;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none">${escapeHtml(action.label)}</a></p>`
    : "";

  return {
    ...base,
    text,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#faf9f5;color:#252523">
    <main style="max-width:600px;margin:0 auto;overflow:hidden;border:1px solid #e6dfd8;border-radius:14px;background:#ffffff">
      <header style="padding:24px 32px;background:#181715;text-align:center">
        <img src="${escapeHtml(safeActionUrl(logoUrl))}" width="122" alt="Eikon Mind" style="display:block;width:122px;height:auto;margin:0 auto" />
      </header>
      <section style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6">
        <p style="margin:0;white-space:pre-line">${escapeHtml(message.body)}</p>
        ${actionMarkup}
      </section>
      <footer style="padding:18px 32px;border-top:1px solid #e6dfd8;color:#64625d;font-family:Arial,Helvetica,sans-serif;font-size:13px;text-align:center">
        Eikon Mind · A calm space for meaningful change
      </footer>
    </main>
  </body>
</html>`,
  };
}
