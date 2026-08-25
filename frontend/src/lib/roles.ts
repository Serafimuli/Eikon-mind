export const ROLES = ["USER", "THERAPIST", "ADMIN"] as const
export type Role = (typeof ROLES)[number]

export function isStaff(role: string): role is "THERAPIST" | "ADMIN" {
  return role === "THERAPIST" || role === "ADMIN"
}

export function canManageTherapist(actorRole: Role, actorId: string, therapistId: string) {
  return actorRole === "ADMIN" || (actorRole === "THERAPIST" && actorId === therapistId)
}
