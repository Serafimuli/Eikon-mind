"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function BackToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const isRomanian = pathname === "/ro" || pathname?.startsWith("/ro/") || !pathname;
  const label = isRomanian ? "Înapoi sus" : "Back to top";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(window.scrollY >= Math.max(window.innerHeight * 0.75, 600));
    };
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  if (!visible) return null;

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
