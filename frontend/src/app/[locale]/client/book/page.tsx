import { BookSlots } from "@/components/BookSlots"
import { listOpenSlots } from "@/lib/appointments"
import { requireUser } from "@/lib/session"
import type { Locale } from "@/lib/site-content"

export default async function Book({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const user = await requireUser(locale)
  const slots = await listOpenSlots()
  return <main className="private-shell"><BookSlots locale={locale} slots={slots} verified={user.emailVerified}/></main>
}
