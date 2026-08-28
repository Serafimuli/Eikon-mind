"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppointmentNotFound() {
  const locale = usePathname().split("/")[1] === "ro" ? "ro" : "en";

  return (
    <main className="page-hero">
      <p className="eyebrow">404</p>
      <h1>{locale === "ro" ? "Programarea nu a fost găsită" : "Appointment not found"}</h1>
      <p>
        {locale === "ro"
          ? "Programarea nu există sau nu mai este disponibilă în contul tău."
          : "The appointment does not exist or is no longer available in your account."}
      </p>
      <Link className="button" href={`/${locale}/client/appointments` as Route}>
        {locale === "ro" ? "Înapoi la programări" : "Back to appointments"}
      </Link>
    </main>
  );
}
