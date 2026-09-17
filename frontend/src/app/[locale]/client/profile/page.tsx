import { and, eq } from "drizzle-orm";
import Link from "next/link";
import type { Route } from "next";
import { EmailVerificationCard } from "@/components/EmailVerificationCard";
import { ProfileSettings } from "@/components/ProfileSettings";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { ActionForm } from "@/components/ActionForm";
import { requestAccountDeletion } from "@/app/[locale]/actions";
import { getDb } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { isStaff } from "@/lib/roles";
import { requireUser } from "@/lib/session";
import type { Locale } from "@/lib/site-content";
import { getProtectedCopy } from "@/lib/protected-content";

export default async function Profile({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const copy = getProtectedCopy(locale).profile;
  const [credentialAccount] = await getDb()
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")))
    .limit(1);

  return (
    <main className="private-shell profile-page">
      <ProfileSettings
        locale={locale}
        user={user}
        hasCredentialPassword={Boolean(credentialAccount)}
      />
      <div
        className={`profile-security-grid${user.emailVerified ? " profile-security-grid--single" : ""}`}
      >
        {!user.emailVerified && (
          <EmailVerificationCard email={user.email} verified={user.emailVerified} locale={locale} />
        )}
        <TwoFactorSetup enabled={user.twoFactorEnabled} locale={locale} />
      </div>
      <div
        className={`profile-account-actions${isStaff(user.role) ? " profile-account-actions--single" : ""}`}
      >
        {!isStaff(user.role) && (
          <section className="danger-zone" aria-labelledby="delete-account-title">
            <h2 id="delete-account-title">{copy.deleteTitle}</h2>
            <p>{copy.deleteBody}</p>
            <ActionForm
              locale={locale}
              className="destructive-form"
              action={requestAccountDeletion.bind(null, locale)}
              errorMessage={copy.deleteError}
            >
              <label>
                {copy.currentPassword}
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
                {copy.acknowledgement}
                <input
                  name="acknowledgement"
                  type="text"
                  pattern="DELETE"
                  autoComplete="off"
                  required
                />
              </label>
              <button className="button button--danger" type="submit">
                {copy.deleteAction}
              </button>
            </ActionForm>
          </section>
        )}
        <section className="form-card" aria-labelledby="data-export-title">
          <p className="eyebrow">GDPR</p>
          <h2 id="data-export-title">{copy.exportTitle}</h2>
          <p>{copy.exportBody}</p>
          <Link
            className="button button--secondary"
            href={`/api/privacy/export?locale=${locale}` as Route}
            prefetch={false}
          >
            {copy.exportAction}
          </Link>
        </section>
      </div>
    </main>
  );
}
