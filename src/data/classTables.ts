export type SlotOverrides = Record<number, number>

export function applySlotOverrides(
  baseSlots: Record<number, number>,
  overrides: SlotOverrides = {}
): Record<number, number> {
  const merged: Record<number, number> = { ...baseSlots }
  for (const [levelKey, override] of Object.entries(overrides)) {
    const level = Number(levelKey)
    if (!Number.isFinite(level)) continue
    const baseValue = merged[level] ?? 0
    merged[level] = Math.max(0, baseValue + override)
  }
  return merged
}
