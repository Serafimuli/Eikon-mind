import { PrivateHeader } from "@/components/PrivateHeader"
import { requireAdmin } from "@/lib/session"
import type { Locale } from "@/lib/site-content"
export const dynamic="force-dynamic"
export default async function AdminLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;await requireAdmin(locale as Locale);return <><PrivateHeader locale={locale as Locale} admin/>{children}</>}
