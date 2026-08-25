import { TwoFactorSetup } from "@/components/TwoFactorSetup"
import { requestAccountDeletion } from "@/app/[locale]/actions"
import { isStaff } from "@/lib/roles"
import { requireUser } from "@/lib/session"
import type { Locale } from "@/lib/site-content"

export default async function Profile({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const user = await requireUser(locale)
  return <main className="private-shell"><h1>{locale === "ro" ? "Profil" : "Profile"}</h1><div className="card"><p>{user.firstName} {user.lastName}</p><p>{user.email}</p><p>{user.emailVerified ? "Email verified" : "Email verification is required before booking."}</p></div><TwoFactorSetup enabled={user.twoFactorEnabled}/>{!isStaff(user.role) && <section className="card"><h2>Delete account</h2><p>This immediately revokes access and removes identifying account data. De-identified records may remain only for the DPO-approved legal retention period.</p><form action={requestAccountDeletion.bind(null, locale)}><button className="button" type="submit">Request account deletion</button></form></section>}</main>
}
