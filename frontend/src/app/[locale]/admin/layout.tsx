import { PrivateHeader } from "@/components/PrivateHeader";
import { requireStaff } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function StaffLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireStaff(locale as Locale);
  return (
    <>
      <PrivateHeader locale={locale as Locale} admin />
      {children}
    </>
  );
}
