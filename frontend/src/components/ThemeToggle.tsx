"use client";
import { useSyncExternalStore } from "react";
import type { Locale } from "@/lib/site-content";

const subscribe = (onStoreChange: () => void) => {
  window.addEventListener("eikon-theme-change", onStoreChange);
  return () => window.removeEventListener("eikon-theme-change", onStoreChange);
};
const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;
export function ThemeToggle({ locale }: { locale: Locale }) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("eikon-theme", next ? "dark" : "light");
    window.dispatchEvent(new Event("eikon-theme-change"));
  };
  return (
    <button
      className="icon-button theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={locale === "ro" ? "Tema întunecată" : "Dark theme"}
      aria-pressed={dark}
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
