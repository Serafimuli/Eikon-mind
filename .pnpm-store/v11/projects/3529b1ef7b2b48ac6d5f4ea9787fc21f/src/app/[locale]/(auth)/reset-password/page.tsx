import { ResetPasswordForm } from "./ResetPasswordForm"
import type { Locale } from "@/lib/site-content"

export const dynamic = "force-dynamic"

export default async function ResetPassword({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  return <ResetPasswordForm locale={locale} token={query.token ?? ""} initialError={query.error ?? ""} />
}
