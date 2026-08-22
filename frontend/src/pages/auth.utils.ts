const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email)
}

export function validateRegisterForm(
  form: {
    firstName: string
    lastName: string
    email: string
    password: string
    confirm: string
  },
  agreed: boolean,
  errors: {
    required: string
    email: string
    passwordLength: string
    passwordMatch: string
    terms: string
  },
) {
  const result: Record<string, string> = {}

  if (!form.firstName.trim()) result.firstName = errors.required

  if (!form.lastName.trim()) result.lastName = errors.required

  if (!form.email) result.email = errors.required
  else if (!isValidEmail(form.email)) result.email = errors.email

  if (!form.password) result.password = errors.required
  else if (form.password.length < 8) result.password = errors.passwordLength

  if (!form.confirm) result.confirm = errors.required
  else if (form.confirm !== form.password) result.confirm = errors.passwordMatch

  if (!agreed) result.terms = errors.terms

  return result
}
