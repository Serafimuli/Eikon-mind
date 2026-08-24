import Link from "next/link"
import type { Locale } from "@/lib/site-content"
export function PublicFooter({locale}:{locale:Locale}) { return <footer className="footer"><div><span className="wordmark">EIKON <span>MIND</span></span><p>Psihoterapie & consiliere</p></div><div><Link href={`/${locale}/politica-de-confidentialitate`}>Confidențialitate</Link><Link href={`/${locale}/politica-de-cookies`}>Cookies</Link><Link href={`/${locale}/termeni-si-conditii`}>Termeni</Link></div><p>© {new Date().getFullYear()} Eikon Mind</p></footer> }
