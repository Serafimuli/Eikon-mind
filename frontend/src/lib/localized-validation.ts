import type { FormEvent, InputHTMLAttributes } from "react";
import type { Locale } from "@/lib/site-content";

type LocalizedInputHandlers = Pick<InputHTMLAttributes<HTMLInputElement>, "onInvalid" | "onInput">;

export function localizedInputHandlers(locale: Locale): LocalizedInputHandlers {
  return {
    onInvalid(event: FormEvent<HTMLInputElement>) {
      const input = event.currentTarget;
      const validity = input.validity;
      let message = "";

      if (validity.valueMissing) {
        message = locale === "ro" ? "Completează acest câmp." : "Please fill out this field.";
      } else if (validity.typeMismatch && input.type === "email") {
        message =
          locale === "ro"
            ? "Introdu o adresă de email validă."
            : "Please enter a valid email address.";
      } else if (validity.tooShort) {
        message =
          locale === "ro"
            ? `Folosește cel puțin ${input.minLength} caractere.`
            : `Please use at least ${input.minLength} characters.`;
      } else if (validity.tooLong) {
        message =
          locale === "ro"
            ? `Folosește cel mult ${input.maxLength} caractere.`
            : `Please use no more than ${input.maxLength} characters.`;
      } else if (validity.patternMismatch) {
        message =
          locale === "ro"
            ? "Introdu valoarea în formatul cerut."
            : "Please match the requested format.";
      }

      input.setCustomValidity(message);
    },
    onInput(event: FormEvent<HTMLInputElement>) {
      event.currentTarget.setCustomValidity("");
    },
  };
}
