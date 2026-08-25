"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ThemeToggle } from "./ThemeToggle"
import { LogoutButton } from "./LogoutButton"
import type { Locale } from "@/lib/site-content"

export function PrivateHeader({ locale, admin = false }: { locale: Locale; admin?: boolean }) {
  const pathname = usePathname() || `/${locale}/${admin ? "admin" : "client"}`
  const [menuOpen, setMenuOpen] = useState(false)
  const base = `/${locale}/${admin ? "admin" : "client"}`
  const isActive = (href: string) => pathname === href ? "is-active" : ""
  const closeMenu = () => setMenuOpen(false)

  return <header className="site-header">
    <div className="site-header__bar">
      <Link className="site-header__brand" href={base} onClick={closeMenu} aria-label="Eikon Mind">
        <Image src="/assets/eikon-mind-mark.png" alt="" width={192} height={192} sizes="36px" className="site-header__logo" />
        <span className="site-header__wordmark">Eikon <span>Mind</span></span>
      </Link>
      <nav id="private-navigation" className={`site-nav private-nav ${menuOpen ? "site-nav--open" : ""}`} aria-label={locale === "ro" ? "Navigație cont" : "Account navigation"}>
        <Link className={isActive(base)} href={base} onClick={closeMenu}>{locale === "ro" ? "Panou" : "Dashboard"}</Link>
        <Link className={isActive(`${base}/appointments`)} href={`${base}/appointments`} onClick={closeMenu}>{locale === "ro" ? "Programări" : "Appointments"}</Link>
        {!admin && <>
          <Link className={isActive(`${base}/book`)} href={`${base}/book`} onClick={closeMenu}>{locale === "ro" ? "Rezervă" : "Book"}</Link>
          <Link className={isActive(`${base}/profile`)} href={`${base}/profile`} onClick={closeMenu}>{locale === "ro" ? "Profil" : "Profile"}</Link>
        </>}
        {admin && <Link className={isActive(`${base}/appointments/new`)} href={`${base}/appointments/new`} onClick={closeMenu}>{locale === "ro" ? "Adaugă" : "Add"}</Link>}
        <LogoutButton locale={locale} />
      </nav>
      <div className="site-header__actions">
        <ThemeToggle />
        <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="private-navigation" onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? (locale === "ro" ? "Închide" : "Close") : (locale === "ro" ? "Meniu" : "Menu")}</button>
      </div>
    </div>
  </header>
}
