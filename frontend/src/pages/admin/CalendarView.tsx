import { useState } from "react"

import type { CalendarViewProps } from "./AdminAppointments.types"

import { groupAppointmentsByDate } from "./AdminAppointments.utils"

export default function CalendarView({
  appointments,
  weekdays,
  monthLocale,
}: CalendarViewProps) {
  const today = new Date()

  const [calYear, setCalYear] = useState(today.getFullYear())

  const [calMonth, setCalMonth] = useState(today.getMonth())

  const monthName = new Date(calYear, calMonth, 1).toLocaleDateString(
    monthLocale,
    { month: "long", year: "numeric" },
  )

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()

  const firstDay = (new Date(calYear, calMonth, 1).getDay() + 6) % 7

  const appointmentsByDate = groupAppointmentsByDate(appointments)

  const changeMonth = (offset: number) => {
    const date = new Date(calYear, calMonth + offset, 1)

    setCalMonth(date.getMonth())

    setCalYear(date.getFullYear())
  }

  return (
    <div className="surface-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
        >
          ←
        </button>
        <span className="font-display font-semibold text-foreground">
          {monthName}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {weekdays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(
          (day) => {
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

            const dayAppointments = appointmentsByDate[dateStr] || []

            const isToday = dateStr === today.toISOString().split("T")[0]

            return (
              <div
                key={day}
                className={`min-h-14 p-1 rounded-lg border transition-colors ${
                  isToday
                    ? "border-primary/50 bg-primary/5"
                    : dayAppointments.length
                      ? "border-border bg-card"
                      : "border-transparent"
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {day}
                </span>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {dayAppointments.slice(0, 2).map((appointment) => (
                    <span
                      key={appointment.id}
                      className="block text-[10px] bg-primary/15 text-primary rounded px-1 truncate"
                    >
                      {appointment.time}
                    </span>
                  ))}
                  {dayAppointments.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{dayAppointments.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )
          },
        )}
      </div>
    </div>
  )
}
