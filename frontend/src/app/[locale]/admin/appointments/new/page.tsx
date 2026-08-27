import { and, asc, eq, gt } from "drizzle-orm";
import { ActionForm } from "@/components/ActionForm";
import { blockAvailability, createAvailability } from "@/app/[locale]/actions";
import { getDb } from "@/lib/db";
import { availabilitySlots } from "@/lib/db/schema";
import { listEnrolledTherapists } from "@/lib/db/repositories";
import { requireStaff } from "@/lib/session";
import type { Locale } from "@/lib/site-content";
import { formatDateTime } from "@/lib/presentation";

export default async function NewAvailability({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const actor = await requireStaff(locale);
  const db = getDb();
  const therapists = actor.role === "ADMIN" ? await listEnrolledTherapists() : [];
  const openSlots = await db
    .select()
    .from(availabilitySlots)
    .where(
      actor.role === "ADMIN"
        ? and(eq(availabilitySlots.state, "OPEN"), gt(availabilitySlots.startsAt, new Date()))
        : and(
            eq(availabilitySlots.therapistId, actor.id),
            eq(availabilitySlots.state, "OPEN"),
            gt(availabilitySlots.startsAt, new Date()),
          ),
    )
    .orderBy(asc(availabilitySlots.startsAt));
  return (
    <main className="private-shell">
      <ActionForm
        action={createAvailability.bind(null, locale)}
        errorMessage={
          locale === "ro"
            ? "Disponibilitatea nu a putut fi publicată."
            : "Availability could not be published."
        }
        className="form-card"
      >
        <p className="eyebrow">Eikon Mind</p>
        <h1>{locale === "ro" ? "Adaugă disponibilitate" : "Add availability"}</h1>
        {actor.role === "ADMIN" && (
          <label>
            {locale === "ro" ? "Terapeut" : "Therapist"}
            <select name="therapistId" defaultValue="" required>
              <option value="">
                {locale === "ro" ? "Selectează terapeutul" : "Select therapist"}
              </option>
              {therapists.map((therapist) => (
                <option value={therapist.id} key={therapist.id}>
                  {therapist.firstName} {therapist.lastName}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          {locale === "ro" ? "Începe la" : "Starts at"}
          <input name="startsAt" type="datetime-local" required />
        </label>
        <label>
          {locale === "ro" ? "Se termină la" : "Ends at"}
          <input name="endsAt" type="datetime-local" required />
        </label>
        <p className="muted">
          {locale === "ro"
            ? "Creează doar intervale de disponibilitate. Formularul nu colectează date despre client sau sănătate."
            : "Create availability times only. This form does not collect client or health information."}
        </p>
        <button className="button" type="submit">
          {locale === "ro" ? "Publică intervalul" : "Publish available time"}
        </button>
      </ActionForm>
      <section className="section">
        <h2>
          {actor.role === "ADMIN"
            ? locale === "ro"
              ? "Disponibilitate deschisă"
              : "Open availability"
            : locale === "ro"
              ? "Disponibilitatea mea"
              : "My open availability"}
        </h2>
        {openSlots.map((slot) => (
          <div className="appointment" key={slot.id}>
            {formatDateTime(slot.startsAt, locale)}
            <ActionForm
              action={blockAvailability.bind(null, locale, slot.id)}
              errorMessage={
                locale === "ro"
                  ? "Intervalul nu a putut fi blocat."
                  : "The availability could not be blocked."
              }
            >
              <button className="icon-button" type="submit">
                {locale === "ro" ? "Blochează" : "Block"}
              </button>
            </ActionForm>
          </div>
        ))}
      </section>
    </main>
  );
}
