import { SiteHeader } from "@/components/SiteHeader";
import { PublicFooter } from "@/components/PublicFooter";
import type { Locale } from "@/lib/site-content";
export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <SiteHeader locale={locale as Locale} />
      <main>{children}</main>
      <PublicFooter locale={locale as Locale} />
    </>
  );
}
