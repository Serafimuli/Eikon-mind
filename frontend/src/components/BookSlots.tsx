"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateTime, formatTime } from "@/lib/presentation";
import type { Locale } from "@/lib/site-content";

type Slot = { id: string; startsAt: Date; endsAt: Date };

export function BookSlots({
  locale,
  slots,
  verified,
  rescheduleFromAppointmentId,
}: {
  locale: Locale;
  slots: Slot[];
  verified: boolean;
  rescheduleFromAppointmentId?: string;
}) {
  const router = useRouter();
  const [slotId, setSlotId] = useState("");
  const [error, setError] = useState("");
  const [originalCancelled, setOriginalCancelled] = useState(false);
  const [busy, setBusy] = useState(false);

  const book = async () => {
    setBusy(true);
    setError("");
    setOriginalCancelled(false);
    try {
      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slotId, rescheduleFromAppointmentId }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        appointmentId?: string;
        originalAppointmentCancelled?: boolean;
      };
      if (!response.ok || !body.appointmentId) {
        if (body.originalAppointmentCancelled) {
          setOriginalCancelled(true);
          setError(
            locale === "ro"
              ? "Programarea inițială a fost anulată, dar intervalul ales nu mai este disponibil. Alege alt interval din pagina de rezervare."
              : "Your original appointment was cancelled, but the selected time is no longer available. Choose another time from the booking page.",
          );
          return;
        }
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
      <h1>
        {rescheduleFromAppointmentId
          ? locale === "ro"
            ? "Reprogramează programarea"
            : "Reschedule appointment"
          : locale === "ro"
            ? "Alege o oră disponibilă"
            : "Choose an available time"}
      </h1>
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
            {busy
              ? "…"
              : rescheduleFromAppointmentId
                ? locale === "ro"
                  ? "Confirmă noua oră"
                  : "Confirm new time"
                : locale === "ro"
                  ? "Rezervă"
                  : "Book"}
          </button>
        </>
      )}
      {error && (
        <div role="alert">
          <p className="error">{error}</p>
          {originalCancelled && (
            <Link className="button button--secondary" href={`/${locale}/client/book`}>
              {locale === "ro" ? "Alege alt interval" : "Choose another time"}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
