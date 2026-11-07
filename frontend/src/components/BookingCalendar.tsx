"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APPOINTMENT_SERVICE_TYPES,
  appointmentServiceLabel,
  type AppointmentServiceType,
} from "@/lib/appointment-types";
import { EMAIL_LOCALE_HEADER } from "@/lib/integrations/email-locale";
import type { Locale } from "@/lib/site-content";

type CalendarSlot = { startsAt: string; endsAt: string };

function firstWeekdayOnOrAfter(date: string) {
  const candidate = new Date(`${date}T00:00:00Z`);
  while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return candidate.toISOString().slice(0, 10);
}

function formatTime(value: string, locale: Locale) {
  return new Date(value).toLocaleTimeString(locale === "ro" ? "ro-RO" : "en-GB", {
    timeZone: "Europe/Bucharest",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookingCalendar({
  locale,
  minDate,
  maxDate,
  verified,
  rescheduleFromAppointmentId,
  initialServiceType,
}: {
  locale: Locale;
  minDate: string;
  maxDate: string;
  verified: boolean;
  rescheduleFromAppointmentId?: string;
  initialServiceType?: AppointmentServiceType;
}) {
  const router = useRouter();
  const [date, setDate] = useState(() => firstWeekdayOnOrAfter(minDate));
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [selected, setSelected] = useState("");
  const [serviceType, setServiceType] = useState<AppointmentServiceType | "">(
    initialServiceType ?? "",
  );
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "loading" | "loaded" | "unavailable"
  >("loading");
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setAvailabilityStatus("loading");
    fetch(`/api/calendar/availability?date=${encodeURIComponent(date)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("availability");
        return response.json() as Promise<{ slots: CalendarSlot[] }>;
      })
      .then((body) => {
        if (controller.signal.aborted) return;
        setSlots(body.slots);
        setAvailabilityStatus("loaded");
      })
      .catch((reason: unknown) => {
        if ((reason as { name?: string }).name !== "AbortError") {
          setSlots([]);
          setAvailabilityStatus("unavailable");
        }
      });
    return () => controller.abort();
  }, [date, availabilityRetry]);

  function changeDate(nextDate: string) {
    setSelected("");
    setError("");
    setAvailabilityStatus("loading");
    setDate(nextDate);
  }

  function retryAvailability() {
    setAvailabilityStatus("loading");
    setAvailabilityRetry((attempt) => attempt + 1);
  }

  async function book() {
    if (!selected || !serviceType) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [EMAIL_LOCALE_HEADER]: locale,
        },
        body: JSON.stringify({ startsAt: selected, serviceType, rescheduleFromAppointmentId }),
      });
      const body = (await response.json().catch(() => ({}))) as { appointmentId?: string };
      if (!response.ok || !body.appointmentId) throw new Error("booking");
      router.push(`/${locale}/client/appointments/${body.appointmentId}`);
    } catch {
      setError(
        locale === "ro"
          ? "Intervalul nu mai este disponibil. Alege o altă oră."
          : "That time is no longer available. Choose another time.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-card booking-calendar">
      <p className="eyebrow">Eikon Mind</p>
      <h1>
        {rescheduleFromAppointmentId
          ? locale === "ro"
            ? "Reprogramează programarea"
            : "Reschedule appointment"
          : locale === "ro"
            ? "Alege data și ora"
            : "Choose a date and time"}
      </h1>
      {!verified ? (
        <p className="error">
          {locale === "ro"
            ? "Verifică adresa de email înainte de rezervare."
            : "Verify your email address before booking."}
        </p>
      ) : (
        <>
          <label>
            {locale === "ro" ? "Dată" : "Date"}
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(event) => changeDate(event.target.value)}
              required
            />
          </label>
          <label htmlFor="serviceType">
            {locale === "ro" ? "Tipul serviciului" : "Service type"}
            <select
              id="serviceType"
              name="serviceType"
              value={serviceType}
              onChange={(event) =>
                setServiceType(event.target.value as AppointmentServiceType | "")
              }
              required
            >
              <option value="">
                {locale === "ro" ? "Alege tipul serviciului" : "Choose a service type"}
              </option>
              {APPOINTMENT_SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {appointmentServiceLabel(type, locale)}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            {locale === "ro"
              ? "Programările online sunt disponibile luni–vineri, între 09:00 și 19:00, cu cel puțin 24 de ore înainte."
              : "Online booking is available Monday–Friday, 09:00–19:00, at least 24 hours in advance."}
          </p>
          <fieldset disabled={availabilityStatus === "loading" || busy}>
            <legend>{locale === "ro" ? "Ore disponibile" : "Available times"}</legend>
            {availabilityStatus === "loading" ? (
              <p className="muted">{locale === "ro" ? "Se încarcă…" : "Loading…"}</p>
            ) : availabilityStatus === "unavailable" ? (
              <div>
                <p className="error">
                  {locale === "ro"
                    ? "Disponibilitatea nu poate fi încărcată acum. Nu știm dacă există intervale libere."
                    : "Availability cannot be loaded right now. We cannot tell whether any times are free."}
                </p>
                <button
                  type="button"
                  className="button button--secondary button--small"
                  onClick={retryAvailability}
                >
                  {locale === "ro" ? "Încearcă din nou" : "Try again"}
                </button>
              </div>
            ) : slots.length === 0 ? (
              <div>
                <p>
                  {locale === "ro"
                    ? "Nu există ore disponibile în această zi."
                    : "No times are available on this date."}
                </p>
                <p className="muted">
                  <Link href={`/${locale}/contact`}>
                    {locale === "ro"
                      ? "Contactează-ne pentru informații despre următoarele intervale disponibile."
                      : "Contact us to ask about upcoming availability."}
                  </Link>
                </p>
              </div>
            ) : (
              <div
                className="booking-times"
                role="radiogroup"
                aria-label={locale === "ro" ? "Ore disponibile" : "Available times"}
              >
                {slots.map((slot) => (
                  <label className="booking-time" key={slot.startsAt}>
                    <input
                      type="radio"
                      name="startsAt"
                      value={slot.startsAt}
                      checked={selected === slot.startsAt}
                      onChange={() => setSelected(slot.startsAt)}
                    />
                    <span>{formatTime(slot.startsAt, locale)}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          {availabilityStatus === "loaded" && slots.length > 0 && (
            <div className="muted">
              <p>
                {locale === "ro" ? "Cel mai apropiat interval" : "Next available time"}:{" "}
                {formatTime(slots[0].startsAt, locale)}
              </p>
              <button
                type="button"
                className="button button--secondary button--small"
                onClick={() => setSelected(slots[0].startsAt)}
              >
                {locale === "ro" ? "Alege acest interval" : "Choose this time"}
              </button>
            </div>
          )}
          <p className="muted">
            <Link href={`/${locale}/politica-de-confidentialitate`}>
              {locale === "ro"
                ? "Citește informarea privind prelucrarea datelor pentru programări."
                : "Read the booking data-processing notice."}
            </Link>
          </p>
          <button
            type="button"
            className="button"
            disabled={!selected || !serviceType || busy}
            onClick={book}
          >
            {busy
              ? "…"
              : rescheduleFromAppointmentId
                ? locale === "ro"
                  ? "Trimite cererea nouă"
                  : "Submit new request"
                : locale === "ro"
                  ? "Trimite cererea"
                  : "Submit request"}
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
