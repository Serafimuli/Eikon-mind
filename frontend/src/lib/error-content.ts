import type { Locale } from "@/lib/site-content";

const errorCopy = {
  ro: {
    eyebrow: "Eikon Mind",
    title: "A apărut o eroare",
    description:
      "Pagina nu a putut fi încărcată. Poți încerca din nou sau poți reveni într-o zonă sigură a site-ului.",
    retry: "Încearcă din nou",
    home: "Înapoi la pagina principală",
    contact: "Contactează-ne",
  },
  en: {
    eyebrow: "Eikon Mind",
    title: "Something went wrong",
    description:
      "The page could not be loaded. You can try again or return to a safe area of the site.",
    retry: "Try again",
    home: "Back to the homepage",
    contact: "Contact us",
  },
} as const;

export function getErrorContent(locale: Locale) {
  return {
    copy: errorCopy[locale],
    homeHref: `/${locale}` as const,
    contactHref: `/${locale}/contact` as const,
  };
}
