export type EmailLocale = "ro" | "en";

export const DEFAULT_EMAIL_LOCALE: EmailLocale = "en";
export const EMAIL_LOCALE_HEADER = "x-app-locale";

export function parseEmailLocale(value: string | null | undefined): EmailLocale {
  return value === "ro" ? "ro" : DEFAULT_EMAIL_LOCALE;
}

export function emailLocaleFromRequest(request?: Request): EmailLocale {
  return parseEmailLocale(request?.headers.get(EMAIL_LOCALE_HEADER));
}

export function emailLocaleFromContext(context: unknown): EmailLocale {
  if (!context || typeof context !== "object") return DEFAULT_EMAIL_LOCALE;
  const request = (context as { request?: Request }).request;
  return emailLocaleFromRequest(request);
}
