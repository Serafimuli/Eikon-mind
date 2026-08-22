import { useApp } from "@/contexts/AppContext"
import type { AppointmentStatus } from "@/data/mockData"

const styles: Record<AppointmentStatus, string> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  confirmed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

const icons: Record<AppointmentStatus, string> = {
  pending: "○",
  confirmed: "●",
  completed: "✓",
  cancelled: "✕",
}

export default function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { tr } = useApp()
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      <span aria-hidden>{icons[status]}</span>
      {tr.status[status]}
    </span>
  )
}
