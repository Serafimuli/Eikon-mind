import type { Role } from "@/lib/roles";

const LOCALES = ["ro", "en"] as const;

export function isLocale(value: string): value is (typeof LOCALES)[number] {
  return (LOCALES as readonly string[]).includes(value);
}

export function localizeAuthDestination(
  requestedPath: string | null | undefined,
  currentLocale: string,
  targetLocale: string,
) {
  if (!requestedPath || !isLocale(currentLocale) || !isLocale(targetLocale)) return null;

  for (const section of ["client", "admin"] as const) {
    if (!isSafeRelativePath(requestedPath, currentLocale, section)) continue;
    const parsed = new URL(requestedPath, "https://eikon-mind.invalid");
    return `/${targetLocale}${parsed.pathname.slice(currentLocale.length + 1)}${parsed.search}`;
  }

  return null;
}

function isSafeRelativePath(
  value: string | null | undefined,
  locale: string,
  section: "client" | "admin",
) {
  if (!value || value.startsWith("//") || value.includes("://")) return false;
  try {
    const parsed = new URL(value, "https://eikon-mind.invalid");
    const prefix = `/${locale}/${section}`;
    return (
      parsed.origin === "https://eikon-mind.invalid" &&
      (parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`))
    );
  } catch {
    return false;
  }
}

export function authDestination(locale: string, role: Role, requestedPath?: string | null) {
  const section = role === "USER" ? "client" : "admin";
  if (isSafeRelativePath(requestedPath, locale, section)) return requestedPath as string;
  return `/${locale}/${section}`;
}
