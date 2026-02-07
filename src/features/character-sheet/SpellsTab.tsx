import type { Spell, SpellSlots, SpellcastingAttribute } from '@/types/character'
import type { SpellLocale } from '@/utils/spellLocale'
import { PcClassTab } from '@/components/PcClassTab'
import { SectionHeader } from '@/components/ui'

type SpellsTabProps = {
  characterClass: string
  subclass: string
  level: number
  spellSlots: SpellSlots
  spells: Spell[]
  spellLocale: SpellLocale
  spellcastingAttribute: SpellcastingAttribute
  spellDC: number | string
  spellAttackBonus: number | string
  currentMaxSlots: Record<number, number>
  onSpellcastingAttributeChange: (value: SpellcastingAttribute) => void
  onUpdateSpellSlot: (level: number, field: 'total' | 'used', value: number) => void
  onAddSpell: (level: number, template?: Partial<Spell>) => string
  onUpdateSpell: (index: number, updates: Partial<Spell>) => void
  onRemoveSpell: (index: number) => void
  onReorderSpells: (fromIndex: number, toIndex: number) => void
}

export function SpellsTab({
  characterClass,
  subclass,
  level,
  spellSlots,
  spells,
  spellLocale,
  spellcastingAttribute,
  spellDC,
  spellAttackBonus,
  currentMaxSlots,
  onSpellcastingAttributeChange,
  onUpdateSpellSlot,
  onAddSpell,
  onUpdateSpell,
  onRemoveSpell,
  onReorderSpells,
}: SpellsTabProps) {
  return (
    <>
      <SectionHeader>Sorts</SectionHeader>
      <PcClassTab
        className={characterClass}
        subclass={subclass}
        level={level}
        spellSlots={spellSlots}
        spells={spells}
        spellLocale={spellLocale}
        spellcastingAttribute={spellcastingAttribute}
        spellDC={spellDC}
        spellAttackBonus={spellAttackBonus}
        currentMaxSlots={currentMaxSlots}
        onSpellcastingAttributeChange={onSpellcastingAttributeChange}
        onUpdateSpellSlot={onUpdateSpellSlot}
        onAddSpell={onAddSpell}
        onUpdateSpell={onUpdateSpell}
        onRemoveSpell={onRemoveSpell}
        onReorderSpells={onReorderSpells}
      />
    </>
  )
}
