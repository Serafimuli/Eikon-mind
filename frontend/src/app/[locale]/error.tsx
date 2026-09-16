"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getErrorContent } from "@/lib/error-content";
import type { Locale } from "@/lib/site-content";

export default function Error({ reset }: { reset: () => void }) {
  const params = useParams<{ locale: string }>();
  const locale: Locale = params.locale === "en" ? "en" : "ro";
  const { copy, homeHref, contactHref } = getErrorContent(locale);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="error-page">
        <section className="error-page__card" aria-labelledby="error-page-title">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="error-page-title">{copy.title}</h1>
          <p>{copy.description}</p>
          <div className="error-page__actions">
            <button className="button" type="button" onClick={reset}>
              {copy.retry}
            </button>
            <Link className="button button--secondary" href={homeHref}>
              {copy.home}
            </Link>
            <Link className="text-link" href={contactHref}>
              {copy.contact} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
