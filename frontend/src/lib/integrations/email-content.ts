import type { TransactionalEmailMessage } from "@/lib/integrations/email-message";
import { DEFAULT_EMAIL_LOCALE, type EmailLocale } from "@/lib/integrations/email-locale";

type FooterCopy = {
  privacy: string;
  terms: string;
  contact: string;
  transactional: string;
};

const footerCopy: Record<EmailLocale, FooterCopy> = {
  en: {
    privacy: "Privacy and data-processing notice",
    terms: "Terms and conditions",
    contact: "Questions about your account? Contact us at contact@eikon-mind.ro.",
    transactional: "This is a transactional email from Eikon Mind.",
  },
  ro: {
    privacy: "Informare privind prelucrarea datelor",
    terms: "Termeni și condiții",
    contact: "Ai întrebări despre cont? Scrie-ne la contact@eikon-mind.ro.",
    transactional: "Acesta este un email tranzacțional de la Eikon Mind.",
  },
};

export function emailFooter(locale: EmailLocale, origin: string) {
  const base = new URL(origin).origin;
  const copy = footerCopy[locale];
  return {
    ...copy,
    privacyUrl: new URL(`/${locale}/politica-de-confidentialitate`, base).toString(),
    termsUrl: new URL(`/${locale}/termeni-si-conditii`, base).toString(),
  };
}

function firstName(value: string | undefined) {
  const name = value?.trim().split(/\s+/)[0];
  return name && name.length <= 80 ? name : undefined;
}

const verificationCopy = {
  en: {
    subject: "Welcome to Eikon Mind — verify your email address",
    greeting: (name?: string) => (name ? `Welcome, ${name}.` : "Welcome to Eikon Mind."),
    body: [
      "Thank you for creating an account with Eikon Mind. Please confirm that this email address belongs to you by selecting the button below.",
      "This personal verification link is intended only for you. Do not forward it or share it with anyone else.",
      "For your security, the link expires after one hour. If it has expired, request a new verification email from your profile.",
      "If you did not create an Eikon Mind account, you can safely ignore this message. If you are concerned about your account, contact us directly.",
    ],
    action: "Verify email address",
  },
  ro: {
    subject: "Bine ai venit la Eikon Mind — verifică adresa de email",
    greeting: (name?: string) =>
      name ? `Bine ai venit, ${name}.` : "Bine ai venit la Eikon Mind.",
    body: [
      "Îți mulțumim că ți-ai creat un cont Eikon Mind. Confirmă că această adresă de email îți aparține apăsând butonul de mai jos.",
      "Acest link personal de verificare este destinat numai ție. Nu îl redirecționa și nu îl distribui nimănui.",
      "Pentru siguranța contului, linkul expiră după o oră. Dacă a expirat, solicită un nou email de verificare din profil.",
      "Dacă nu ai creat un cont Eikon Mind, poți ignora acest mesaj. Dacă ai nelămuriri despre cont, contactează-ne direct.",
    ],
    action: "Verifică adresa de email",
  },
} satisfies Record<
  EmailLocale,
  { subject: string; greeting: (name?: string) => string; body: string[]; action: string }
>;

const resetCopy = {
  en: {
    subject: "Reset your Eikon Mind password",
    body: [
      "We received a request to set a new password for your Eikon Mind account.",
      "This personal reset link is intended only for you. Do not forward it or share it with anyone else.",
      "For your security, the link expires after one hour. If you did not request a reset, you can safely ignore this email and your current password will remain unchanged.",
    ],
    action: "Reset password",
  },
  ro: {
    subject: "Resetează parola contului Eikon Mind",
    body: [
      "Am primit o solicitare pentru setarea unei parole noi pentru contul tău Eikon Mind.",
      "Acest link personal de resetare este destinat numai ție. Nu îl redirecționa și nu îl distribui nimănui.",
      "Pentru siguranța contului, linkul expiră după o oră. Dacă nu ai solicitat resetarea, poți ignora acest email, iar parola actuală va rămâne neschimbată.",
    ],
    action: "Resetează parola",
  },
} satisfies Record<EmailLocale, { subject: string; body: string[]; action: string }>;

const passwordChangedCopy = {
  en: {
    subject: "Your Eikon Mind password was updated",
    body: "Your Eikon Mind password was successfully updated. If you did not make this change, reset your password immediately and contact us at contact@eikon-mind.ro.",
  },
  ro: {
    subject: "Parola contului Eikon Mind a fost schimbată",
    body: "Parola contului tău Eikon Mind a fost schimbată cu succes. Dacă nu tu ai făcut această modificare, resetează imediat parola și contactează-ne la contact@eikon-mind.ro.",
  },
} satisfies Record<EmailLocale, { subject: string; body: string }>;

const appointmentCopy = {
  en: {
    confirmed: {
      subject: "Your Eikon Mind appointment is confirmed",
      body: "Your appointment has been confirmed. Sign in to Eikon Mind to view the latest information.",
    },
    cancelled: {
      subject: "Your Eikon Mind appointment was cancelled",
      body: "Your appointment has been cancelled. Sign in to Eikon Mind if you need to review your account or arrange another time.",
    },
    requested: {
      subject: "New Eikon Mind appointment request",
      body: "A new appointment request is available. Sign in to Eikon Mind to review it.",
    },
    updated: {
      subject: "Your Eikon Mind appointment was updated",
      body: "Your appointment information was updated. Sign in to Eikon Mind to view the latest information.",
    },
  },
  ro: {
    confirmed: {
      subject: "Programarea ta Eikon Mind este confirmată",
      body: "Programarea ta a fost confirmată. Autentifică-te în Eikon Mind pentru a vedea cele mai recente informații.",
    },
    cancelled: {
      subject: "Programarea ta Eikon Mind a fost anulată",
      body: "Programarea ta a fost anulată. Autentifică-te în Eikon Mind dacă vrei să verifici contul sau să alegi un alt interval.",
    },
    requested: {
      subject: "Solicitare nouă de programare Eikon Mind",
      body: "Este disponibilă o solicitare nouă de programare. Autentifică-te în Eikon Mind pentru a o verifica.",
    },
    updated: {
      subject: "Programarea ta Eikon Mind a fost actualizată",
      body: "Informațiile programării tale au fost actualizate. Autentifică-te în Eikon Mind pentru a vedea cele mai recente informații.",
    },
  },
} satisfies Record<
  EmailLocale,
  Record<"confirmed" | "cancelled" | "requested" | "updated", { subject: string; body: string }>
>;

const operationsCopy = {
  subject: (eventType: string) => `Eikon Mind security alert: ${eventType}`,
  body: (eventType: string) =>
    `A critical ${eventType} event was recorded. Review the privacy-minimized security audit.`,
};

export function securityEmail(
  kind: "verify" | "reset",
  url: string,
  locale: EmailLocale = DEFAULT_EMAIL_LOCALE,
  name?: string,
): TransactionalEmailMessage {
  if (kind === "verify") {
    const copy = verificationCopy[locale];
    return {
      locale,
      align: "center",
      subject: copy.subject,
      body: [copy.greeting(firstName(name)), ...copy.body].join("\n\n"),
      action: { label: copy.action, url },
    };
  }

  const copy = resetCopy[locale];
  return {
    locale,
    subject: copy.subject,
    body: copy.body.join("\n\n"),
    action: { label: copy.action, url },
  };
}

export function passwordChangedEmail(
  locale: EmailLocale = DEFAULT_EMAIL_LOCALE,
): TransactionalEmailMessage {
  const copy = passwordChangedCopy[locale];
  return {
    locale,
    subject: copy.subject,
    body: copy.body,
  };
}

export function appointmentEmail(
  kind: "confirmed" | "cancelled" | "requested" | "updated",
  locale: EmailLocale = DEFAULT_EMAIL_LOCALE,
  origin?: string,
): TransactionalEmailMessage {
  const copy = appointmentCopy[locale][kind];
  return {
    locale,
    subject: copy.subject,
    body: copy.body,
    ...(origin
      ? {
          action: {
            label: locale === "ro" ? "Deschide programările" : "Open appointments",
            url: new URL(`/${locale}/client/appointments`, origin).toString(),
          },
        }
      : {}),
  };
}

export function securityOperationsEmail(eventType: string): TransactionalEmailMessage {
  return {
    locale: DEFAULT_EMAIL_LOCALE,
    subject: operationsCopy.subject(eventType),
    body: operationsCopy.body(eventType),
  };
}
