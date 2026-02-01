import type { Spell, SpellSlots, SpellcastingAttribute } from '@/types/character'
import { PcClassTab } from '@/components/PcClassTab'
import { SectionHeader } from '@/components/ui'

type SpellsTabProps = {
  characterClass: string
  subclass: string
  level: number
  spellSlots: SpellSlots
  spells: Spell[]
  spellcastingAttribute: SpellcastingAttribute
  spellDC: number | string
  spellAttackBonus: number | string
  currentMaxSlots: Record<number, number>
  onSpellcastingAttributeChange: (value: SpellcastingAttribute) => void
  onUpdateSpellSlot: (level: number, field: 'total' | 'used', value: number) => void
  onAddSpell: (level: number) => string
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
