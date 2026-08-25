"use client"

import { SiteHeader } from "./SiteHeader"
import type { Locale } from "@/lib/site-content"

export function HomeHeader({ locale }: { locale: Locale }) {
  return <SiteHeader locale={locale} />
}
