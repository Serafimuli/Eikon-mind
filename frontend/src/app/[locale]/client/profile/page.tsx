import { EmailVerificationCard } from "@/components/EmailVerificationCard";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { ActionForm } from "@/components/ActionForm";
import { requestAccountDeletion } from "@/app/[locale]/actions";
import { isStaff } from "@/lib/roles";
import { requireUser } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function Profile({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await requireUser(locale);
  return (
    <main className="private-shell">
      <h1>{locale === "ro" ? "Profil" : "Profile"}</h1>
      <div className="card">
        <p>
          {user.firstName} {user.lastName}
        </p>
        <p>{user.email}</p>
      </div>
      <EmailVerificationCard email={user.email} verified={user.emailVerified} locale={locale} />
      <TwoFactorSetup enabled={user.twoFactorEnabled} locale={locale} />
      {!isStaff(user.role) && (
        <section className="card">
          <h2>{locale === "ro" ? "Ștergerea contului" : "Delete account"}</h2>
          <p>
            {locale === "ro"
              ? "Accesul este revocat imediat, iar datele de identificare sunt eliminate. Datele anonimizate pot rămâne doar pentru perioada legală aprobată."
              : "Access is revoked immediately and identifying account data is removed. De-identified records may remain only for the approved legal retention period."}
          </p>
          <ActionForm
            action={requestAccountDeletion.bind(null, locale)}
            errorMessage={
              locale === "ro"
                ? "Confirmarea ștergerii nu este validă."
                : "The deletion confirmation is invalid."
            }
          >
            <label>
              {locale === "ro" ? "Parola curentă" : "Current password"}
              <input
                name="password"
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              {locale === "ro" ? "Scrie DELETE pentru confirmare" : "Type DELETE to confirm"}
              <input
                name="acknowledgement"
                type="text"
                pattern="DELETE"
                autoComplete="off"
                required
              />
            </label>
            <button className="button" type="submit">
              {locale === "ro" ? "Șterge definitiv contul" : "Permanently delete account"}
            </button>
          </ActionForm>
        </section>
      )}
    </main>
  );
}
