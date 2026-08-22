import type { Dispatch, SetStateAction } from "react"

export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6

export type SetBookingStep = Dispatch<SetStateAction<BookingStep>>

export const UNAVAILABLE_DAYS = [0, 6] as const
