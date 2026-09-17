"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HeaderShell } from "@/components/HeaderShell";
import { LogoutButton } from "./LogoutButton";
import { getProtectedCopy, roleLabel } from "@/lib/protected-content";
import type { Role } from "@/lib/roles";
import type { Locale } from "@/lib/site-content";

export function PrivateHeader({ locale, role }: { locale: Locale; role: Role }) {
  const staff = role === "THERAPIST" || role === "ADMIN";
  const pathname = usePathname() || `/${locale}/${staff ? "admin" : "client"}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const copy = getProtectedCopy(locale);
  const base = `/${locale}/${staff ? "admin" : "client"}` as Route;
  const route = (path: string) => path as Route;
  const closeMenu = () => setMenuOpen(false);
  const items = [
    { key: "dashboard", label: copy.navigation.dashboard, href: base },
    {
      key: "appointments",
      label: copy.navigation.appointments,
      href: route(`${base}/appointments`),
    },
    ...(role === "USER"
      ? [{ key: "book", label: copy.navigation.book, href: route(`${base}/book`) }]
      : [
          {
            key: "availability",
            label: copy.navigation.availability,
            href: route(`${base}/appointments/new`),
          },
        ]),
    ...(role === "ADMIN"
      ? [{ key: "staff", label: copy.navigation.staff, href: route(`${base}/staff`) }]
      : []),
    {
      key: "profile",
      label: copy.navigation.profile,
      href: route(`/${locale}/client/profile`),
    },
  ];
  const activeItem = items
    .filter(({ href }) => pathname === href || (href !== base && pathname.startsWith(`${href}/`)))
    .sort((left, right) => right.href.length - left.href.length)[0];

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
        aria-label={copy.navigation.label}
      >
        <span
          className="private-role-badge"
          aria-label={`${copy.navigation.accountType}: ${roleLabel(locale, role)}`}
        >
          {roleLabel(locale, role)}
        </span>
        {items.map((item) => (
          <Link
            className={activeItem?.key === item.key ? "is-active" : ""}
            href={item.href}
            onClick={closeMenu}
            aria-current={activeItem?.key === item.key ? "page" : undefined}
            key={item.key}
          >
            {item.label}
          </Link>
        ))}
        <LogoutButton locale={locale} label={copy.navigation.logout} />
      </nav>
    </HeaderShell>
  );
}
