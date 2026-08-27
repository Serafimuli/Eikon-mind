"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HeaderShell } from "@/components/HeaderShell";
import { LogoutButton } from "./LogoutButton";
import type { Locale } from "@/lib/site-content";

export function PrivateHeader({ locale, admin = false }: { locale: Locale; admin?: boolean }) {
  const pathname = usePathname() || `/${locale}/${admin ? "admin" : "client"}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const base = `/${locale}/${admin ? "admin" : "client"}` as Route;
  const route = (path: string) => path as Route;
  const isActive = (href: string) => (pathname === href ? "is-active" : "");
  const closeMenu = () => setMenuOpen(false);

  return (
    <HeaderShell
      locale={locale}
      homeHref={base}
      navigationId="private-navigation"
      menuOpen={menuOpen}
      onClose={closeMenu}
      onMenuToggle={() => setMenuOpen((open) => !open)}
      logoSize={36}
    >
      <nav
        id="private-navigation"
        className={`site-nav private-nav ${menuOpen ? "site-nav--open" : ""}`}
        aria-label={locale === "ro" ? "Navigație cont" : "Account navigation"}
      >
        <Link className={isActive(base)} href={base} onClick={closeMenu}>
          {locale === "ro" ? "Panou" : "Dashboard"}
        </Link>
        <Link
          className={isActive(`${base}/appointments`)}
          href={route(`${base}/appointments`)}
          onClick={closeMenu}
        >
          {locale === "ro" ? "Programări" : "Appointments"}
        </Link>
        {!admin && (
          <Link
            className={isActive(`${base}/book`)}
            href={route(`${base}/book`)}
            onClick={closeMenu}
          >
            {locale === "ro" ? "Rezervă" : "Book"}
          </Link>
        )}
        <Link
          className={isActive(`/${locale}/client/profile`)}
          href={route(`/${locale}/client/profile`)}
          onClick={closeMenu}
        >
          {locale === "ro" ? "Profil" : "Profile"}
        </Link>
        {admin && (
          <Link
            className={isActive(`${base}/appointments/new`)}
            href={route(`${base}/appointments/new`)}
            onClick={closeMenu}
          >
            {locale === "ro" ? "Adaugă" : "Add"}
          </Link>
        )}
        <LogoutButton locale={locale} />
      </nav>
    </HeaderShell>
  );
}
