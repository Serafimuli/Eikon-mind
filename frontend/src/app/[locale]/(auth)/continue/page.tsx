import { redirect } from "next/navigation";
import type { Route } from "next";
import { authDestination } from "@/lib/auth-routing";
import { getCurrentUser } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function GoogleAuthContinue({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login?oauthError=1`);
  redirect(authDestination(locale, user.role, query.returnTo) as Route);
}
