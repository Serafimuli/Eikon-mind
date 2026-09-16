import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import type { Locale } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function VerifyEmail({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  return (
    <>
      <SiteHeader locale={locale} />
      <main className="private-shell">
        <section className="form-card auth-card">
          <p className="eyebrow">Eikon Mind</p>
          <h1>{locale === "ro" ? "Verifică adresa de email" : "Verify your email address"}</h1>
          {query.error ? (
            <p className="error" role="alert">
              {locale === "ro"
                ? "Linkul de verificare este invalid sau expirat."
                : "That verification link is invalid or expired."}
            </p>
          ) : (
            <p>
              {locale === "ro"
                ? "Ți-am trimis un link de verificare. Îți poți accesa profilul în timp ce adresa este în curs de verificare."
                : "We sent you a verification link. You can access your profile while your address is pending verification."}
            </p>
          )}
          <p className="muted">
            {locale === "ro"
              ? "Dacă nu găsești mesajul, verifică folderul spam sau retrimite-l din profil."
              : "If you cannot find it, check spam or resend it from your profile."}
          </p>
          <Link className="button" href={`/${locale}/client/profile`}>
            {locale === "ro" ? "Mergi la profil" : "Go to profile"}
          </Link>
        </section>
      </main>
    </>
  );
}
