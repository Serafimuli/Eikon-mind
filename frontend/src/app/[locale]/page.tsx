import { HomePageContent } from "@/components/PublicContent";
import { PublicFooter } from "@/components/PublicFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { locales, site, type Locale } from "@/lib/site-content";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return (
    <>
      <SiteHeader locale={locale} />
      <main>
        <HomePageContent locale={locale} content={site[locale].home} />
      </main>
      <PublicFooter locale={locale} />
    </>
  );
}
