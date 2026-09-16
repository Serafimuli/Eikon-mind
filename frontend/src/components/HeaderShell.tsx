"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, type ReactNode } from "react";
import { MusicToggleButton } from "@/components/BackgroundMusic";
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
  showMusicControl = false,
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
  showMusicControl?: boolean;
}) {
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen || !window.matchMedia("(max-width: 767px)").matches) return;

    const header = headerRef.current;
    const menuButton = menuButtonRef.current;
    if (!header || !menuButton) return;

    const previousOverflow = document.body.style.overflow;
    const backgroundElements = Array.from(
      document.querySelectorAll<HTMLElement>("main, footer, .back-to-top, .music-toggle"),
    ).filter((element) => !header.contains(element));
    const previousInertStates = backgroundElements.map((element) => ({
      element,
      inert: element.inert,
    }));
    const getFocusableElements = () =>
      Array.from(
        header.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          element.offsetParent !== null &&
          !element.hidden &&
          !element.closest("[hidden]") &&
          !element.inert,
      );

    document.body.style.overflow = "hidden";
    backgroundElements.forEach((element) => {
      element.inert = true;
    });

    const focusFrame = window.requestAnimationFrame(() => {
      header.querySelector<HTMLElement>(`#${navigationId} a[href]`)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!header.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousInertStates.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      if (document.contains(menuButton)) menuButton.focus();
    };
  }, [menuOpen, navigationId, onClose]);

  return (
    <header className="site-header" ref={headerRef}>
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
          {showMusicControl && !menuOpen && <MusicToggleButton />}
          <ThemeToggle />
          {scheduleAction && (
            <Link className="schedule-button" href={scheduleAction.href} onClick={onClose}>
              {scheduleAction.label}
            </Link>
          )}
          <button
            ref={menuButtonRef}
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
