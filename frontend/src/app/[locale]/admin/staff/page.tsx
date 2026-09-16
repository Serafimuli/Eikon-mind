import { changeStaffRole } from "@/app/[locale]/actions";
import { ConfirmActionForm } from "@/components/ConfirmActionForm";
import { listStaffCandidates } from "@/lib/db/repositories";
import { getProtectedCopy, roleLabel } from "@/lib/protected-content";
import type { Role } from "@/lib/roles";
import { requireAdmin } from "@/lib/session";
import type { Locale } from "@/lib/site-content";

export default async function StaffManagement({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const admin = await requireAdmin(locale);
  const rows = (await listStaffCandidates()).filter((user) => user.id !== admin.id);
  const copy = getProtectedCopy(locale).staff;

  function roleAction(user: (typeof rows)[number], role: Role, label: string) {
    const eligible = user.emailVerified && user.twoFactorEnabled;
    const promotion = role === "THERAPIST" || role === "ADMIN";
    const eligibilityId = `staff-eligibility-${user.id}`;
    return (
      <ConfirmActionForm
        key={role}
        locale={locale}
        action={changeStaffRole.bind(null, locale, user.id, role)}
        triggerLabel={label}
        confirmationMessage={copy.confirmRole(
          `${user.firstName} ${user.lastName}`,
          roleLabel(locale, role),
        )}
        confirmLabel={copy.confirmRoleAction}
        errorMessage={copy.roleError}
        disabled={promotion && !eligible}
        describedBy={!eligible && promotion ? eligibilityId : undefined}
      />
    );
  }

  return (
    <main className="private-shell">
      <h1>{copy.title}</h1>
      <p>{copy.intro}</p>
      <div className="appointment-list">
        {rows.length ? (
          rows.map((user) => {
            const eligible = user.emailVerified && user.twoFactorEnabled;
            return (
              <article className="appointment staff-card" key={user.id}>
                <div className="staff-card__identity">
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                  <span>{user.email}</span>
                  <div className="staff-badges">
                    <span className="status-badge status-badge--role">
                      {roleLabel(locale, user.role)}
                    </span>
                    <span
                      className={`status-badge${user.emailVerified ? " status-badge--success" : ""}`}
                    >
                      {user.emailVerified ? copy.emailVerified : copy.emailNotVerified}
                    </span>
                    <span
                      className={`status-badge${user.twoFactorEnabled ? " status-badge--success" : ""}`}
                    >
                      {user.twoFactorEnabled ? copy.totpEnabled : copy.totpNotEnabled}
                    </span>
                  </div>
                  <p className="staff-eligibility" id={`staff-eligibility-${user.id}`}>
                    {eligible ? copy.eligible : copy.ineligible}
                  </p>
                </div>
                <div className="staff-actions">
                  {user.role !== "THERAPIST" && roleAction(user, "THERAPIST", copy.makeTherapist)}
                  {user.role !== "ADMIN" && roleAction(user, "ADMIN", copy.makeAdmin)}
                  {user.role !== "USER" && roleAction(user, "USER", copy.removeRole)}
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty-state">
            <p>{copy.empty}</p>
          </div>
        )}
      </div>
    </main>
  );
}
