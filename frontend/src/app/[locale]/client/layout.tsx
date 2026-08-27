import { PrivateHeader } from "@/components/PrivateHeader";
import { requireUser } from "@/lib/session";
import { isStaff } from "@/lib/roles";
import type { Locale } from "@/lib/site-content";
export const dynamic = "force-dynamic";
export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser(locale as Locale);
  return (
    <>
      <PrivateHeader locale={locale as Locale} admin={isStaff(user.role)} />
      {children}
    </>
  );
}
