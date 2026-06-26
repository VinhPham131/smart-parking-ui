/** Minutes since midnight in local time for a Date. */
export function getLocalTimeMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

/** Parse HTML time input "HH:mm". */
export function timeStringToMinutes(t: string): number | null {
  const s = t.trim()
  if (!s) return null
  const [h, m] = s.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function overlapsLocalCalendarDay(
  checkIn: Date,
  checkOut: Date,
  day: Date,
): boolean {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(day)
  end.setHours(23, 59, 59, 999)
  return checkIn <= end && checkOut >= start
}

export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart
}
