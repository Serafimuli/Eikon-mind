"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState, type FocusEvent, type MouseEvent } from "react";
import { site, type Locale } from "@/lib/site-content";
import { HeaderShell } from "@/components/HeaderShell";

const serviceLinks = [
  ["adulti", "Adulți", "Adults"],
  ["copii-si-adolescenti", "Copii și adolescenți", "Children and teenagers"],
  ["familii", "Familii", "Families"],
  ["seniori", "Seniori", "Older adults"],
  ["adictii", "Adicții", "Addiction support"],
  ["formare-profesionala", "Formare profesională", "Professional training"],
] as const;

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [servicesHovered, setServicesHovered] = useState(false);
  const [servicesFocused, setServicesFocused] = useState(false);
  const copy = site[locale].nav;
  const switchLocale = locale === "ro" ? "en" : "ro";
  const currentPath = pathname.replace(/^\/(ro|en)(?=\/|$)/, "") || "/";
  const servicesExpanded = servicesOpen || servicesHovered || servicesFocused;
  const servicesDropdownId = "public-services-dropdown";

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setServicesOpen(false);
    setServicesHovered(false);
    setServicesFocused(false);
  }, []);

  const handleServicesPointerEnter = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      setServicesHovered(true);
    }
  };

  const handleServicesPointerLeave = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      setServicesHovered(false);
    }
  };

  const handleServicesBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) {
      setServicesFocused(false);
      setServicesOpen(false);
    }
  };

  const handleServicesClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (typeof window === "undefined" || window.matchMedia("(hover: hover)").matches) {
      if (event.detail > 0) {
        setServicesFocused(false);
      }
      return;
    }

    setServicesFocused(false);
    setServicesOpen((open) => !open);
  };

  return (
    <HeaderShell
      locale={locale}
      homeHref={`/${locale}` as Route}
      navigationId="public-navigation"
      menuOpen={menuOpen}
      onClose={closeMenu}
      onMenuToggle={() => setMenuOpen((open) => !open)}
      scheduleAction={{ href: `/${locale}/programare` as Route, label: copy.scheduling }}
    >
      <nav
        id="public-navigation"
        className={`site-nav ${menuOpen ? "site-nav--open" : ""}`}
        aria-label={locale === "ro" ? "Navigație principală" : "Main navigation"}
      >
        <Link
          href={`/${locale}`}
          className={currentPath === "/" ? "is-active" : ""}
          onClick={closeMenu}
        >
          {copy.home}
        </Link>
        <div
          className="service-menu"
          onPointerEnter={handleServicesPointerEnter}
          onPointerLeave={handleServicesPointerLeave}
          onFocus={() => setServicesFocused(true)}
          onBlur={handleServicesBlur}
        >
          <button
            type="button"
            className="service-menu__trigger"
            aria-expanded={servicesExpanded}
            aria-controls={servicesDropdownId}
            onClick={handleServicesClick}
          >
            {copy.services}
            <span className="service-menu__chevron" aria-hidden="true">
              ⌄
            </span>
          </button>
          <div
            id={servicesDropdownId}
            className={`service-dropdown ${servicesExpanded ? "service-dropdown--open" : ""}`}
            hidden={!servicesExpanded}
          >
            {serviceLinks.map(([slug, roTitle, enTitle]) => (
              <Link href={`/${locale}/${slug}`} key={slug} onClick={closeMenu}>
                <span>{locale === "ro" ? roTitle : enTitle}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
        <Link
          href={`/${locale}/despre-mine`}
          className={currentPath === "/despre-mine" ? "is-active" : ""}
          onClick={closeMenu}
        >
          {copy.about}
        </Link>
        <Link
          href={`/${locale}/programare`}
          className={currentPath === "/programare" ? "is-active" : ""}
          onClick={closeMenu}
        >
          {copy.scheduling}
        </Link>
        <Link
          href={`/${locale}/contact`}
          className={currentPath === "/contact" ? "is-active" : ""}
          onClick={closeMenu}
        >
          {copy.contact}
        </Link>
        <span className="site-nav__spacer" />
        <Link
          href={`/${switchLocale}${currentPath === "/" ? "" : currentPath}` as Route}
          className="locale-switch"
          onClick={closeMenu}
        >
          {switchLocale.toUpperCase()}
        </Link>
        <Link href={`/${locale}/login`} className="account-link" onClick={closeMenu}>
          {copy.login}
        </Link>
      </nav>
    </HeaderShell>
  );
}
