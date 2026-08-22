export interface RegisterForm {
  firstName: string

  lastName: string

  email: string

  password: string

  confirm: string
}

export type AuthFieldErrors = Record<string, string>
