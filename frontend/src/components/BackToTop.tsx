"use client";

import { usePathname } from "next/navigation";

export function BackToTop() {
  const pathname = usePathname();
  const isRomanian = pathname === "/ro" || pathname?.startsWith("/ro/") || !pathname;
  const label = isRomanian ? "Înapoi sus" : "Back to top";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      className="back-to-top"
      type="button"
      aria-label={label}
      title={label}
      onClick={scrollToTop}
    >
      <svg className="back-to-top__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 12h14M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
