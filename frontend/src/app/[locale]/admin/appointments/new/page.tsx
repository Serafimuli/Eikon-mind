import { and, asc, eq, gt } from "drizzle-orm";
import { blockAvailability, createAvailability } from "@/app/[locale]/actions";
import { ActionForm } from "@/components/ActionForm";
import { ConfirmActionForm } from "@/components/ConfirmActionForm";
import { getDb } from "@/lib/db";
import { listEnrolledTherapists } from "@/lib/db/repositories";
import { availabilitySlots, users } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/presentation";
import { getProtectedCopy } from "@/lib/protected-content";
import { requireStaff } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function NewAvailability({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const actor = await requireStaff(locale);
  const db = getDb();
  const therapists = actor.role === "ADMIN" ? await listEnrolledTherapists() : [];
  const openSlots = await db
    .select({
      slot: availabilitySlots,
      therapistFirstName: users.firstName,
      therapistLastName: users.lastName,
    })
    .from(availabilitySlots)
    .innerJoin(users, eq(availabilitySlots.therapistId, users.id))
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
  const copy = getProtectedCopy(locale).availability;

  return (
    <main className="private-shell">
      <ActionForm
        locale={locale}
        action={createAvailability.bind(null, locale)}
        errorMessage={copy.publishError}
        className="form-card"
      >
        <p className="eyebrow">Eikon Mind</p>
        <h1>{copy.title}</h1>
        {actor.role === "ADMIN" && (
          <label>
            {copy.therapist}
            <select name="therapistId" defaultValue="" required>
              <option value="">{copy.selectTherapist}</option>
              {therapists.map((therapist) => (
                <option value={therapist.id} key={therapist.id}>
                  {therapist.firstName} {therapist.lastName}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          {copy.starts}
          <input name="startsAt" type="datetime-local" required />
        </label>
        <label>
          {copy.ends}
          <input name="endsAt" type="datetime-local" required />
        </label>
        <p className="muted">{copy.notice}</p>
        <button className="button" type="submit">
          {copy.publish}
        </button>
      </ActionForm>
      <section className="section">
        <h2>{actor.role === "ADMIN" ? copy.adminOpen : copy.therapistOpen}</h2>
        {openSlots.length ? (
          openSlots.map(({ slot, therapistFirstName, therapistLastName }) => (
            <article className="appointment" key={slot.id}>
              <div className="appointment-meta">
                <span>{formatDateTime(slot.startsAt, locale)}</span>
                {actor.role === "ADMIN" && (
                  <span>
                    {copy.therapist}: {therapistFirstName} {therapistLastName}
                  </span>
                )}
              </div>
              <ConfirmActionForm
                locale={locale}
                action={blockAvailability.bind(null, locale, slot.id)}
                triggerLabel={copy.block}
                confirmationMessage={copy.confirmBlock}
                confirmLabel={copy.confirmBlockAction}
                errorMessage={copy.blockError}
              />
            </article>
          ))
        ) : (
          <div className="empty-state">
            <p>{actor.role === "ADMIN" ? copy.emptyAdmin : copy.emptyTherapist}</p>
          </div>
        )}
      </section>
    </main>
  );
}
