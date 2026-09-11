"use client";

import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/site-content";

type ProfileSettingsProps = {
  locale: Locale;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: boolean;
  };
  hasCredentialPassword: boolean;
};

type Feedback = { error: string; success: string };

const emptyFeedback: Feedback = { error: "", success: "" };

export function ProfileSettings({ locale, user, hasCredentialPassword }: ProfileSettingsProps) {
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailFeedback, setEmailFeedback] = useState<Feedback>(emptyFeedback);
  const [emailBusy, setEmailBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(emptyFeedback);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const text = {
    account: locale === "ro" ? "Contul tău" : "Your account",
    welcome:
      locale === "ro"
        ? "Gestionează datele de contact și setările de securitate într-un singur loc."
        : "Manage your contact details and security settings in one place.",
    verified: locale === "ro" ? "Email verificat" : "Email verified",
    unverified: locale === "ro" ? "Email neverificat" : "Email not verified",
    emailTitle: locale === "ro" ? "Adresa de email" : "Email address",
    currentEmail: locale === "ro" ? "Adresa curentă" : "Current address",
    emailDescription:
      locale === "ro"
        ? "Noua adresă devine activă doar după ce este verificată."
        : "Your new address becomes active only after it has been verified.",
    newEmail: locale === "ro" ? "Adresă de email nouă" : "New email address",
    confirmEmail: locale === "ro" ? "Confirmă adresa nouă" : "Confirm new address",
    changeEmail: locale === "ro" ? "Trimite verificarea" : "Send verification",
    emailMismatch:
      locale === "ro" ? "Adresele de email nu corespund." : "The email addresses do not match.",
    emailSuccess:
      locale === "ro"
        ? "Dacă adresa poate fi folosită, vei primi un email de verificare."
        : "If the address can be used, you will receive a verification email.",
    emailError:
      locale === "ro"
        ? "Nu am putut începe schimbarea adresei. Încearcă din nou după ce te autentifici."
        : "We could not start the email change. Try again after signing in.",
    passwordTitle: locale === "ro" ? "Parolă" : "Password",
    passwordDescription:
      locale === "ro"
        ? "Schimbarea parolei va deconecta celelalte dispozitive."
        : "Changing your password will sign out your other devices.",
    currentPassword: locale === "ro" ? "Parola curentă" : "Current password",
    newPassword: locale === "ro" ? "Parolă nouă" : "New password",
    confirmPassword: locale === "ro" ? "Confirmă parola nouă" : "Confirm new password",
    changePassword: locale === "ro" ? "Schimbă parola" : "Change password",
    passwordHint:
      locale === "ro"
        ? "Folosește între 12 și 128 de caractere."
        : "Use between 12 and 128 characters.",
    passwordMismatch:
      locale === "ro" ? "Parolele noi nu corespund." : "The new passwords do not match.",
    passwordError:
      locale === "ro"
        ? "Nu am putut schimba parola. Verifică parola curentă și încearcă din nou."
        : "We could not change the password. Check your current password and try again.",
    passwordSuccess:
      locale === "ro"
        ? "Parola a fost schimbată, iar celelalte dispozitive au fost deconectate."
        : "Your password was changed and your other devices were signed out.",
    googleTitle: locale === "ro" ? "Parolă gestionată de Google" : "Password managed by Google",
    googleDescription:
      locale === "ro"
        ? "Te autentifici cu Google, deci parola ta este gestionată în contul Google."
        : "You sign in with Google, so your password is managed in your Google account.",
  };

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailFeedback(emptyFeedback);
    if (newEmail.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setEmailFeedback({ error: text.emailMismatch, success: "" });
      return;
    }

    setEmailBusy(true);
    const result = await authClient.changeEmail({
      newEmail: newEmail.trim(),
      callbackURL: `/${locale}/client/profile`,
    });
    setEmailBusy(false);
    if (result.error) {
      setEmailFeedback({ error: text.emailError, success: "" });
      return;
    }
    setNewEmail("");
    setConfirmEmail("");
    setEmailFeedback({ error: "", success: text.emailSuccess });
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordFeedback(emptyFeedback);
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ error: text.passwordMismatch, success: "" });
      return;
    }

    setPasswordBusy(true);
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setPasswordBusy(false);
    if (result.error) {
      setPasswordFeedback({ error: text.passwordError, success: "" });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordFeedback({ error: "", success: text.passwordSuccess });
  }

  return (
    <>
      <section className="profile-hero" aria-labelledby="profile-title">
        <div className="profile-hero__identity">
          <span className="profile-avatar" aria-hidden="true">
            {user.firstName.slice(0, 1)}
            {user.lastName.slice(0, 1)}
          </span>
          <div>
            <p className="eyebrow">Eikon Mind</p>
            <h1 id="profile-title">{text.account}</h1>
            <p>{text.welcome}</p>
          </div>
        </div>
        <div className={`profile-status ${user.emailVerified ? "is-verified" : "is-pending"}`}>
          <span aria-hidden="true">{user.emailVerified ? "✓" : "!"}</span>
          {user.emailVerified ? text.verified : text.unverified}
        </div>
      </section>

      <div className="profile-settings-grid">
        <section className="card profile-card" aria-labelledby="profile-email-title">
          <div className="profile-card__heading">
            <div>
              <p className="eyebrow">{text.currentEmail}</p>
              <h2 id="profile-email-title">{text.emailTitle}</h2>
            </div>
            <span className="profile-email-value">{user.email}</span>
          </div>
          <p>{text.emailDescription}</p>
          <form onSubmit={submitEmail} noValidate>
            <label>
              {text.newEmail}
              <input
                type="email"
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label>
              {text.confirmEmail}
              <input
                type="email"
                value={confirmEmail}
                onChange={(event) => setConfirmEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <div className="profile-form-footer">
              <button
                className="button"
                type="submit"
                disabled={emailBusy || !newEmail || !confirmEmail}
              >
                {emailBusy ? "…" : text.changeEmail}
              </button>
              <div aria-live="polite">
                {emailFeedback.success && <p className="success">{emailFeedback.success}</p>}
                {emailFeedback.error && (
                  <p className="error" role="alert">
                    {emailFeedback.error}
                  </p>
                )}
              </div>
            </div>
          </form>
        </section>

        {hasCredentialPassword ? (
          <section className="card profile-card" aria-labelledby="profile-password-title">
            <div className="profile-card__heading">
              <div>
                <p className="eyebrow">{text.passwordHint}</p>
                <h2 id="profile-password-title">{text.passwordTitle}</h2>
              </div>
            </div>
            <p>{text.passwordDescription}</p>
            <form onSubmit={submitPassword} noValidate>
              <label>
                {text.currentPassword}
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
              <label>
                {text.newPassword}
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
              <label>
                {text.confirmPassword}
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
              <div className="profile-form-footer">
                <button
                  className="button"
                  type="submit"
                  disabled={
                    passwordBusy || !currentPassword || newPassword.length < 12 || !confirmPassword
                  }
                >
                  {passwordBusy ? "…" : text.changePassword}
                </button>
                <div aria-live="polite">
                  {passwordFeedback.success && (
                    <p className="success">{passwordFeedback.success}</p>
                  )}
                  {passwordFeedback.error && (
                    <p className="error" role="alert">
                      {passwordFeedback.error}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </section>
        ) : (
          <section
            className="card profile-card profile-card--muted"
            aria-labelledby="profile-password-title"
          >
            <p className="eyebrow">Google</p>
            <h2 id="profile-password-title">{text.googleTitle}</h2>
            <p>{text.googleDescription}</p>
          </section>
        )}
      </div>
    </>
  );
}
