import { EmailVerificationCard } from "@/components/EmailVerificationCard"
import { TwoFactorSetup } from "@/components/TwoFactorSetup"
import { requestAccountDeletion } from "@/app/[locale]/actions"
import { isStaff } from "@/lib/roles"
import { requireUser } from "@/lib/session"
import type { Locale } from "@/lib/site-content"

export default async function Profile({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const user = await requireUser(locale)
  return <main className="private-shell">
    <h1>{locale === "ro" ? "Profil" : "Profile"}</h1>
    <div className="card"><p>{user.firstName} {user.lastName}</p><p>{user.email}</p></div>
    <EmailVerificationCard email={user.email} verified={user.emailVerified} locale={locale} />
    <TwoFactorSetup enabled={user.twoFactorEnabled} locale={locale} />
    {!isStaff(user.role) && <section className="card">
      <h2>{locale === "ro" ? "Ștergerea contului" : "Delete account"}</h2>
      <p>{locale === "ro" ? "Accesul este revocat imediat, iar datele de identificare sunt eliminate. Datele anonimizate pot rămâne doar pentru perioada legală aprobată." : "Access is revoked immediately and identifying account data is removed. De-identified records may remain only for the approved legal retention period."}</p>
      <form action={requestAccountDeletion.bind(null, locale)}><button className="button" type="submit">{locale === "ro" ? "Solicită ștergerea contului" : "Request account deletion"}</button></form>
    </section>}
  </main>
}
