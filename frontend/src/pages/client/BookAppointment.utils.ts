import { UNAVAILABLE_DAYS } from "./BookAppointment.types"

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function isUnavailableDate(
  year: number,
  month: number,
  day: number,
  today: Date,
) {
  const date = new Date(year, month, day)

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )

  return (
    date < todayStart ||
    UNAVAILABLE_DAYS.includes(date.getDay() as typeof UNAVAILABLE_DAYS[number])
  )
}
