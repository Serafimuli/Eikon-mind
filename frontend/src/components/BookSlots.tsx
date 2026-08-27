"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateTime, formatTime } from "@/lib/presentation";
import type { Locale } from "@/lib/site-content";

type Slot = { id: string; startsAt: Date; endsAt: Date };

export function BookSlots({
  locale,
  slots,
  verified,
}: {
  locale: Locale;
  slots: Slot[];
  verified: boolean;
}) {
  const router = useRouter();
  const [slotId, setSlotId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const book = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slotId }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        appointmentId?: string;
      };
      if (!response.ok || !body.appointmentId) {
        setError(
          locale === "ro"
            ? "Intervalul nu mai este disponibil. Alege altul."
            : "That time is no longer available. Choose another one.",
        );
        return;
      }
      router.push(`/${locale}/client/appointments/${body.appointmentId}`);
    } catch {
      setError(
        locale === "ro"
          ? "Rezervarea nu a putut fi trimisă. Încearcă din nou."
          : "The booking could not be submitted. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="form-card">
      <p className="eyebrow">Eikon Mind</p>
      <h1>{locale === "ro" ? "Alege o oră disponibilă" : "Choose an available time"}</h1>
      {!verified ? (
        <p className="error">
          {locale === "ro"
            ? "Verifică adresa de email înainte de rezervare."
            : "Verify your email address before booking."}
        </p>
      ) : slots.length === 0 ? (
        <p>
          {locale === "ro"
            ? "Nu există momentan intervale disponibile."
            : "No appointment times are currently available."}
        </p>
      ) : (
        <>
          <label>
            {locale === "ro" ? "Interval disponibil" : "Available time"}
            <select value={slotId} onChange={(event) => setSlotId(event.target.value)} required>
              <option value="">
                {locale === "ro" ? "Selectează un interval" : "Select a time"}
              </option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {formatDateTime(slot.startsAt, locale)} – {formatTime(slot.endsAt, locale)}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            {locale === "ro"
              ? "Se colectează doar ora programării. Nu transmite informații medicale sau clinice prin acest formular."
              : "Only the appointment time is collected. Do not send health or clinical information through this form."}
          </p>
          <button type="button" className="button" disabled={busy || !slotId} onClick={book}>
            {busy ? "…" : locale === "ro" ? "Rezervă" : "Book"}
          </button>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
