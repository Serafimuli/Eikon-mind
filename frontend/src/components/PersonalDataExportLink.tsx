"use client";

import Link from "next/link";
import type { Route } from "next";
import type { MouseEvent } from "react";
import { useState } from "react";
import type { Locale } from "@/lib/site-content";

export function PersonalDataExportLink({
  locale,
  label,
  href,
}: {
  locale: Locale;
  label: string;
  href: Route;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const failureMessage =
    locale === "ro"
      ? "Exportul nu este disponibil momentan. Încearcă din nou."
      : "Your export is temporarily unavailable. Please try again.";

  const download = async () => {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(href, { cache: "no-store", credentials: "same-origin" });
      if (
        !response.ok ||
        !response.headers.get("content-type")?.toLowerCase().includes("application/pdf")
      ) {
        throw new Error("Export request failed");
      }

      const objectUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "eikon-mind-personal-data.pdf";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
    } catch {
      setError(failureMessage);
    } finally {
      setBusy(false);
    }
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    if (!busy) void download();
  };

  return (
    <>
      <Link
        className="button button--secondary"
        href={href}
        prefetch={false}
        aria-busy={busy}
        onClick={handleClick}
      >
        {busy ? (locale === "ro" ? "Se pregătește…" : "Preparing…") : label}
      </Link>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
