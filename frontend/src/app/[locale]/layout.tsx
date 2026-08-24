import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { locales, type Locale } from "@/lib/site-content"
export function generateStaticParams(){return locales.map(locale=>({locale}))}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const {locale}=await params;if(!locales.includes(locale as Locale))return {};return {alternates:{canonical:`/${locale}`,languages:{ro:"/ro",en:"/en"}},openGraph:{locale:locale==="ro"?"ro_RO":"en_US",type:"website"}}}
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;if(!locales.includes(locale as Locale))notFound();return children}
