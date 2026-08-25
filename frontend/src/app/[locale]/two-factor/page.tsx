import { TwoFactorChallenge } from "@/components/TwoFactorChallenge"
import { SiteHeader } from "@/components/SiteHeader"
import type { Locale } from "@/lib/site-content"

export const dynamic = "force-dynamic"

export default async function TwoFactorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ returnTo?: string }>
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  return <><SiteHeader locale={locale} /><main className="private-shell"><TwoFactorChallenge locale={locale} returnTo={query.returnTo ?? ""} /></main></>
}
