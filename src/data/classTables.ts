type SpellcastingType = "full" | "half" | "pact" | "none";

type LevelProgression = {
  slots: [number, number, number, number, number, number, number, number, number];
  classResource?: number;
  knownSpells?: number;
};

type ClassProgression = {
  spellcastingType: SpellcastingType;
  resourceName?: string;
  // Index 1-20 are valid levels. Index 0 is a placeholder.
  levels: Array<LevelProgression | null>;
};

const ZERO_SLOTS: LevelProgression["slots"] = [0, 0, 0, 0, 0, 0, 0, 0, 0];

export type SlotOverrides = Record<number, number>;

export const CLASS_PROGRESSION: Record<string, ClassProgression> = {
  Wizard: {
    spellcastingType: "full",
    levels: [
      null,
      { slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
      { slots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
      { slots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
      { slots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
      { slots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
      { slots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
      { slots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
      { slots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
      { slots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
      { slots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
      { slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
      { slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
      { slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
      { slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
      { slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
      { slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
      { slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
      { slots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
      { slots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
      { slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
    ],
  },
  Warlock: {
    spellcastingType: "pact",
    levels: [
      null,
      { slots: [1, 0, 0, 0, 0, 0, 0, 0, 0] },
      { slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
      { slots: [0, 2, 0, 0, 0, 0, 0, 0, 0] },
      { slots: [0, 2, 0, 0, 0, 0, 0, 0, 0] },
      { slots: [0, 0, 2, 0, 0, 0, 0, 0, 0] },
      { slots: [0, 0, 2, 0, 0, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 2, 0, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 2, 0, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 2, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 2, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 3, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 3, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 3, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 3, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 3, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 3, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 4, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 4, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 4, 0, 0, 0, 0] },
      { slots: [0, 0, 0, 0, 4, 0, 0, 0, 0] },
    ],
  },
  Monk: {
    spellcastingType: "none",
    resourceName: "Ki",
    levels: [
      null,
      { slots: ZERO_SLOTS, classResource: 1 },
      { slots: ZERO_SLOTS, classResource: 2 },
      { slots: ZERO_SLOTS, classResource: 3 },
      { slots: ZERO_SLOTS, classResource: 4 },
      { slots: ZERO_SLOTS, classResource: 5 },
      { slots: ZERO_SLOTS, classResource: 6 },
      { slots: ZERO_SLOTS, classResource: 7 },
      { slots: ZERO_SLOTS, classResource: 8 },
      { slots: ZERO_SLOTS, classResource: 9 },
      { slots: ZERO_SLOTS, classResource: 10 },
      { slots: ZERO_SLOTS, classResource: 11 },
      { slots: ZERO_SLOTS, classResource: 12 },
      { slots: ZERO_SLOTS, classResource: 13 },
      { slots: ZERO_SLOTS, classResource: 14 },
      { slots: ZERO_SLOTS, classResource: 15 },
      { slots: ZERO_SLOTS, classResource: 16 },
      { slots: ZERO_SLOTS, classResource: 17 },
      { slots: ZERO_SLOTS, classResource: 18 },
      { slots: ZERO_SLOTS, classResource: 19 },
      { slots: ZERO_SLOTS, classResource: 20 },
    ],
  },
  Fighter: {
    spellcastingType: "none",
    levels: [
      null,
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
      { slots: ZERO_SLOTS, classResource: 0 },
    ],
  },
};

const clampLevel = (level: number) => Math.max(1, Math.min(20, Math.floor(level || 1)));

export function getClassSlots(className: string, level: number): Record<number, number> {
  const normalizedLevel = clampLevel(level);
  const classData = CLASS_PROGRESSION[className];
  const slots = classData?.levels[normalizedLevel]?.slots ?? ZERO_SLOTS;
  return slots.reduce<Record<number, number>>((acc, value, index) => {
    acc[index + 1] = value;
    return acc;
  }, {});
}

export function applySlotOverrides(
  baseSlots: Record<number, number>,
  overrides: SlotOverrides = {}
): Record<number, number> {
  const merged: Record<number, number> = { ...baseSlots };
  for (const [levelKey, override] of Object.entries(overrides)) {
    const level = Number(levelKey);
    if (!Number.isFinite(level)) continue;
    const baseValue = merged[level] ?? 0;
    merged[level] = Math.max(0, baseValue + override);
  }
  return merged;
}
