"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ThemeToggle } from "./ThemeToggle"
import { site, type Locale } from "@/lib/site-content"
export function SiteHeader({locale,home=false}:{locale:Locale;home?:boolean}){
 const path=usePathname()||`/${locale}`; const [open,setOpen]=useState(false); const copy=site[locale].nav
 const swap=path.replace(/^\/(ro|en)(?=\/|$)/,`/${locale==="ro"?"en":"ro"}`)
 return <header className={`site-header ${home?"home-header":""}`}><Link className="wordmark" href={`/${locale}`}>EIKON <span>MIND</span></Link><button className="menu-button" onClick={()=>setOpen(!open)} aria-expanded={open}>Meniu</button><nav className={open?"open":""}><Link href={`/${locale}/adulti`}>{copy.services}</Link><Link href={`/${locale}/despre-mine`}>{copy.about}</Link><Link href={`/${locale}/programare`}>{copy.scheduling}</Link><Link href={`/${locale}/contact`}>{copy.contact}</Link><Link href={swap} aria-label="Switch language">{locale.toUpperCase()}</Link><ThemeToggle/><Link className="header-account" href={`/${locale}/login`}>{copy.login}</Link></nav></header>
}
