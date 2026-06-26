/** Slots physically in use (checked in), excluding reserved and maintenance. */
export function calcOccupiedSlots(area: {
  slots_quantity?: number
  total_slots?: number
  available_slots?: number
  reserved_slots?: number
  maintenance_slots?: number
}): number {
  const total = Math.max(0, Number(area.slots_quantity ?? area.total_slots ?? 0))
  const available = Math.max(0, Number(area.available_slots ?? 0))
  const reserved = Math.max(0, Number(area.reserved_slots ?? 0))
  const maintenance = Math.max(0, Number(area.maintenance_slots ?? 0))
  return Math.max(0, total - available - reserved - maintenance)
}
