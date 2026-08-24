"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { site, type Locale } from "@/lib/site-content"

const serviceLinks = [
  ["adulti", "Adulți", "Adults"],
  ["copii-si-adolescenti", "Copii și adolescenți", "Children and teenagers"],
  ["familii", "Familii", "Families"],
  ["seniori", "Seniori", "Older adults"],
  ["adictii", "Adicții", "Addiction support"],
  ["formare-profesionala", "Formare profesională", "Professional training"],
] as const

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`
  const [menuOpen, setMenuOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const copy = site[locale].nav
  const switchLocale = locale === "ro" ? "en" : "ro"
  const currentPath = pathname.replace(/^\/(ro|en)(?=\/|$)/, "") || "/"

  const closeMenu = () => {
    setMenuOpen(false)
    setServicesOpen(false)
  }

  return <header className="site-header">
    <div className="site-header__bar">
      <Link className="site-header__brand" href={`/${locale}`} onClick={closeMenu} aria-label="Eikon Mind">
        <Image src="/assets/eikon-mind-mark.png" alt="" width={192} height={192} sizes="48px" className="site-header__logo" />
      </Link>
      <nav id="public-navigation" className={`site-nav ${menuOpen ? "site-nav--open" : ""}`} aria-label="Navigație principală">
        <Link href={`/${locale}`} className={currentPath === "/" ? "is-active" : ""} onClick={closeMenu}>{copy.home}</Link>
        <div className="service-menu">
          <button type="button" className="service-menu__trigger" aria-expanded={servicesOpen} onClick={() => setServicesOpen((open) => !open)}>{copy.services}<span aria-hidden="true">⌄</span></button>
          <div className={`service-dropdown ${servicesOpen ? "service-dropdown--open" : ""}`}>
            {serviceLinks.map(([slug, roTitle, enTitle]) => <Link href={`/${locale}/${slug}`} key={slug} onClick={closeMenu}><span>{locale === "ro" ? roTitle : enTitle}</span><span aria-hidden="true">↗</span></Link>)}
          </div>
        </div>
        <Link href={`/${locale}/despre-mine`} className={currentPath === "/despre-mine" ? "is-active" : ""} onClick={closeMenu}>{copy.about}</Link>
        <Link href={`/${locale}/programare`} className={currentPath === "/programare" ? "is-active" : ""} onClick={closeMenu}>{copy.scheduling}</Link>
        <Link href={`/${locale}/contact`} className={currentPath === "/contact" ? "is-active" : ""} onClick={closeMenu}>{copy.contact}</Link>
        <span className="site-nav__spacer" />
        <Link href={`/${switchLocale}${currentPath === "/" ? "" : currentPath}`} className="locale-switch" onClick={closeMenu}>{switchLocale.toUpperCase()}</Link>
        <Link href={`/${locale}/login`} className="account-link" onClick={closeMenu}>{copy.login}</Link>
      </nav>
      <div className="site-header__actions">
        <span className="header-search" aria-hidden="true">⌕</span>
        <Link className="schedule-button" href={`/${locale}/programare`} onClick={closeMenu}>{copy.scheduling}</Link>
        <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="public-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? "Închide" : "Meniu"}</button>
      </div>
    </div>
  </header>
}
