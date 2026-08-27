import { SiteHeader } from "@/components/SiteHeader";
import type { Locale } from "@/lib/site-content";
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <>
      <SiteHeader locale={(await params).locale as Locale} />
      {children}
    </>
  );
}
