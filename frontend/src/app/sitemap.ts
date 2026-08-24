import type { MetadataRoute } from "next"
import { locales, publicSlugs } from "@/lib/site-content"
export default function sitemap():MetadataRoute.Sitemap{return locales.flatMap(locale=>[`/${locale}`,...publicSlugs.map(s=>`/${locale}/${s}`)].map(url=>({url:`https://eikon-mind.ro${url}`,lastModified:new Date()})))}
