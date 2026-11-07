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
      <a className="skip-link" href="#main-content">
        {locale === "ro" ? "Sari la conținutul principal" : "Skip to main content"}
      </a>
      <SiteHeader locale={locale as Locale} />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <PublicFooter locale={locale as Locale} />
    </>
  );
}
