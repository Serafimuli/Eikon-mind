import type { ChangeEvent } from "react"

interface RegisterFieldProps {
  id: string

  label: string

  type?: string

  autoComplete?: string

  placeholder?: string

  value: string

  onChange: (event: ChangeEvent<HTMLInputElement>) => void

  error?: string
}

export default function RegisterField({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
  value,
  onChange,
  error,
}: RegisterFieldProps) {
  return (
    <div>
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`form-control ${
          error ? "border-red-400 focus:ring-red-300" : ""
        }`}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
