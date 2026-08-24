import { requireUser } from "@/lib/session"
import type { Locale } from "@/lib/site-content"
export default async function Profile({params}:{params:Promise<{locale:Locale}>}){const {locale}=await params;const user=await requireUser(locale);return <main className="private-shell"><h1>{locale==="ro"?"Profil":"Profile"}</h1><div className="card"><p>{user.firstName} {user.lastName}</p><p>{user.email}</p></div></main>}
