import { changeStaffRole } from "@/app/[locale]/actions";
import { ActionForm } from "@/components/ActionForm";
import { listStaffCandidates } from "@/lib/db/repositories";
import { requireAdmin } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function StaffManagement({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const admin = await requireAdmin(locale);
  const rows = await listStaffCandidates();
  return (
    <main className="private-shell">
      <h1>{locale === "ro" ? "Administrarea personalului" : "Staff management"}</h1>
      <p>
        {locale === "ro"
          ? "Doar utilizatorii cu email verificat și TOTP activ pot deveni terapeuți sau administratori."
          : "Only users with a verified email and enrolled TOTP can become therapists or administrators."}
      </p>
      <div className="appointment-list">
        {rows
          .filter((user) => user.id !== admin.id)
          .map((user) => (
            <div className="appointment" key={user.id}>
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <br />
              {user.email} · {user.role} ·{" "}
              {user.twoFactorEnabled ? "TOTP enabled" : "TOTP not enrolled"}
              <ActionForm
                action={changeStaffRole.bind(null, locale, user.id, "THERAPIST")}
                errorMessage={
                  locale === "ro"
                    ? "Rolul nu a putut fi schimbat."
                    : "The staff role could not be changed."
                }
              >
                <button
                  className="icon-button"
                  disabled={!user.emailVerified || !user.twoFactorEnabled}
                >
                  Make therapist
                </button>
              </ActionForm>
              <ActionForm
                action={changeStaffRole.bind(null, locale, user.id, "ADMIN")}
                errorMessage={
                  locale === "ro"
                    ? "Rolul nu a putut fi schimbat."
                    : "The staff role could not be changed."
                }
              >
                <button
                  className="icon-button"
                  disabled={!user.emailVerified || !user.twoFactorEnabled}
                >
                  Make admin
                </button>
              </ActionForm>
              <ActionForm
                action={changeStaffRole.bind(null, locale, user.id, "USER")}
                errorMessage={
                  locale === "ro"
                    ? "Rolul nu a putut fi schimbat."
                    : "The staff role could not be changed."
                }
              >
                <button className="icon-button">Remove staff role</button>
              </ActionForm>
            </div>
          ))}
      </div>
    </main>
  );
}
