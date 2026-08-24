import type { MetadataRoute } from "next"
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:"/",disallow:["/ro/client","/en/client","/ro/admin","/en/admin"]},sitemap:"https://eikon-mind.ro/sitemap.xml"}}
