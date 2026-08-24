import { notFound } from "next/navigation"
import { PublicPageContent } from "@/components/PublicContent"
import { getPage, locales, publicSlugs, type Locale, type PublicSlug } from "@/lib/site-content"

export function generateStaticParams() {
  return locales.flatMap((locale) => publicSlugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params
  const page = getPage(locale, slug)
  return page ? { title: page.title, description: page.description, alternates: { canonical: `/${locale}/${slug}`, languages: { ro: `/ro/${slug}`, en: `/en/${slug}` } } } : {}
}

export default async function PublicPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params
  const page = getPage(locale, slug)
  if (!page || !publicSlugs.includes(slug as PublicSlug)) notFound()
  return <PublicPageContent locale={locale} page={page} />
}

