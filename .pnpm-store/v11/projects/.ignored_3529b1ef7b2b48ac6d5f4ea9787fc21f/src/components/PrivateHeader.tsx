import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"
import { LogoutButton } from "./LogoutButton"
import type { Locale } from "@/lib/site-content"
export function PrivateHeader({locale,admin=false}:{locale:Locale;admin?:boolean}){const base=`/${locale}/${admin?"admin":"client"}`;return <header className="site-header"><Link className="wordmark" href={base}>EIKON <span>MIND</span></Link><nav><Link href={base}>{locale==="ro"?"Panou":"Dashboard"}</Link><Link href={`${base}/appointments`}>{locale==="ro"?"Programări":"Appointments"}</Link>{!admin&&<><Link href={`${base}/book`}>{locale==="ro"?"Rezervă":"Book"}</Link><Link href={`${base}/profile`}>{locale==="ro"?"Profil":"Profile"}</Link></>}{admin&&<Link href={`${base}/appointments/new`}>{locale==="ro"?"Adaugă":"Add"}</Link>}<ThemeToggle/><LogoutButton locale={locale}/></nav></header>}
