"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Locale } from "@/lib/site-content";

export function HeaderShell({
  locale,
  homeHref,
  navigationId,
  menuOpen,
  onClose,
  onMenuToggle,
  children,
  scheduleAction,
  logoSize = 48,
}: {
  locale: Locale;
  homeHref: Route;
  navigationId: string;
  menuOpen: boolean;
  onClose: () => void;
  onMenuToggle: () => void;
  children: ReactNode;
  scheduleAction?: { href: Route; label: string };
  logoSize?: number;
}) {
  return (
    <header className="site-header">
      <div className="site-header__bar">
        <Link
          className="site-header__brand"
          href={homeHref}
          onClick={onClose}
          aria-label="Eikon Mind"
        >
          <Image
            src="/assets/eikon-mind-mark.png"
            alt=""
            width={192}
            height={192}
            sizes={`${logoSize}px`}
            className="site-header__logo"
          />
          <span className="site-header__wordmark">
            Eikon <span>Mind</span>
          </span>
        </Link>
        {children}
        <div className="site-header__actions">
          <ThemeToggle />
          {scheduleAction && (
            <Link className="schedule-button" href={scheduleAction.href} onClick={onClose}>
              {scheduleAction.label}
            </Link>
          )}
          <button
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls={navigationId}
            onClick={onMenuToggle}
          >
            {menuOpen
              ? locale === "ro"
                ? "Închide"
                : "Close"
              : locale === "ro"
                ? "Meniu"
                : "Menu"}
          </button>
        </div>
      </div>
    </header>
  );
}
