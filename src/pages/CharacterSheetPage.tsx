import { useRef, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCharacterForm, useExportToImage } from '@/hooks'
import {
  PaperContainer,
  TextInput,
  Textarea,
  AutoResizeTextarea,
  Button,
  SectionHeader,
  FieldLabel,
  Box,
  Toolbar,
  Row,
  Col,
  Select,
} from '@/components/ui'
import { calculateAbilityModifier } from '@/types/abilities'
import { ABILITIES_ORDER, ABILITY_LABELS, SKILL_DATA } from '@/features/character-sheet/constants'
import type { Attack, Trait, Spell } from '@/types/character'

export default function CharacterSheetPage() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { character, updateField, handleExport, handleImport, reset } = useCharacterForm()
  const { exportToPdf, exportToPng, isExporting } = useExportToImage()
  const [error, setError] = useState<string | null>(null)

  // Calculate proficiency bonus from level
  const proficiencyBonus = useMemo(() => {
    const level = character.level || 1
    return Math.ceil(level / 4) + 1
  }, [character.level])

  // Calculate Spell Save DC automatically based on spellcastingAttribute
  const spellDC = useMemo(() => {
    if (character.spellcastingAttribute === 'None') return ''
    const abilityMap: Record<string, keyof typeof character.abilities> = {
      'INT': 'int',
      'WIS': 'wis',
      'CHA': 'cha',
    }
    const mappedKey = abilityMap[character.spellcastingAttribute]
    if (!mappedKey) return ''
    const abilityScore = character.abilities[mappedKey]
    const abilityModifier = calculateAbilityModifier(abilityScore)
    return 8 + proficiencyBonus + abilityModifier
  }, [character.spellcastingAttribute, character.abilities, proficiencyBonus])

  // Calculate Spell Attack Bonus automatically based on spellcastingAttribute
  const spellAttackBonus = useMemo(() => {
    if (character.spellcastingAttribute === 'None') return ''
    const abilityMap: Record<string, keyof typeof character.abilities> = {
      'INT': 'int',
      'WIS': 'wis',
      'CHA': 'cha',
    }
    const mappedKey = abilityMap[character.spellcastingAttribute]
    if (!mappedKey) return ''
    const abilityScore = character.abilities[mappedKey]
    const abilityModifier = calculateAbilityModifier(abilityScore)
    return proficiencyBonus + abilityModifier
  }, [character.spellcastingAttribute, character.abilities, proficiencyBonus])

  // Handle ability score changes
  const handleAbilityChange = (ability: string, value: number) => {
    const score = Math.max(1, Math.min(30, value || 10))
    updateField('abilities', { ...character.abilities, [ability]: score })
  }

  // Handle skill proficiency toggle
  const toggleSkillProficiency = (skillKey: string) => {
    updateField('skills', {
      ...character.skills,
      [skillKey]: !character.skills[skillKey as keyof typeof character.skills],
    })
  }

  // Calculate skill bonus
  const getSkillBonus = (skillKey: string) => {
    const skill = SKILL_DATA.find((s) => s.key === skillKey)
    if (!skill) return 0
    const abilityScore = character.abilities[skill.ability]
    const abilityMod = calculateAbilityModifier(abilityScore)
    const isProficient = character.skills[skillKey as keyof typeof character.skills] || false
    return abilityMod + (isProficient ? proficiencyBonus : 0)
  }

  // Attacks management
  const addAttack = () => {
    updateField('attacks', [...character.attacks, { name: '', bonus: '', damage: '', notes: '' }])
  }

  const updateAttack = (index: number, updates: Partial<Attack>) => {
    const newAttacks = [...character.attacks]
    const current = newAttacks[index]
    if (!current) return
    newAttacks[index] = { 
      name: updates.name ?? current.name,
      bonus: updates.bonus ?? current.bonus,
      damage: updates.damage ?? current.damage,
      notes: updates.notes ?? current.notes,
    }
    updateField('attacks', newAttacks)
  }

  const removeAttack = (index: number) => {
    updateField('attacks', character.attacks.filter((_, i) => i !== index))
  }

  // Traits management
  const addTrait = () => {
    updateField('traits', [...character.traits, { name: '', notes: '' }])
  }

  const updateTrait = (index: number, updates: Partial<Trait>) => {
    const newTraits = [...character.traits]
    const current = newTraits[index]
    if (!current) return
    newTraits[index] = {
      name: updates.name ?? current.name,
      notes: updates.notes ?? current.notes,
    }
    updateField('traits', newTraits)
  }

  const removeTrait = (index: number) => {
    updateField('traits', character.traits.filter((_, i) => i !== index))
  }

  // Spells management
  const addSpell = (level: number) => {
    updateField('spells', [
      ...character.spells,
      { name: '', level: level.toString(), notes: '', prepared: false },
    ])
  }

  const updateSpell = (index: number, updates: Partial<Spell>) => {
    const newSpells = [...character.spells]
    const current = newSpells[index]
    if (!current) return
    newSpells[index] = {
      name: updates.name ?? current.name,
      level: updates.level ?? current.level,
      notes: updates.notes ?? current.notes,
      prepared: updates.prepared ?? current.prepared,
    }
    updateField('spells', newSpells)
  }

  const removeSpell = (index: number) => {
    updateField('spells', character.spells.filter((_, i) => i !== index))
  }

  // Spell slots management
  const updateSpellSlot = (level: number, field: 'total' | 'used', value: number) => {
    const slots = { ...character.spellSlots }
    if (!slots[level]) {
      slots[level] = { total: 0, used: 0 }
    }
    slots[level] = { ...slots[level], [field]: value }
    updateField('spellSlots', slots)
  }

  // Export handlers
  const handleExportClick = () => {
    try {
      handleExport()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await handleImport(file)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    }
    e.target.value = ''
  }

  const handleDownloadPdf = async () => {
    try {
      await exportToPdf(sheetRef, 'fiche-pj.pdf')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF export failed')
    }
  }

  const handleDownloadPng = async () => {
    try {
      await exportToPng(sheetRef, 'fiche-pj.png')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PNG export failed')
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure? Unsaved changes will be lost.')) {
      reset()
      setError(null)
    }
  }

  // Group spells by level
  const spellsByLevel = useMemo(() => {
    const grouped: Record<number, Spell[]> = {}
    for (let i = 0; i <= 9; i++) {
      grouped[i] = character.spells.filter((s) => String(s.level) === String(i))
    }
    return grouped
  }, [character.spells])

  return (
    <div className="min-h-screen p-5 bg-gray-200">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-3">
        <Toolbar
          left={
            <Link to="/">
              <Button>⬅ Retour</Button>
            </Link>
          }
          right={
            <>
              <Button onClick={handleExportClick}>Exporter la fiche (JSON)</Button>
              <Button onClick={handleImportClick}>Importer une fiche</Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button onClick={handleReset} variant="small">
                Reset
              </Button>
              <Button onClick={handleDownloadPdf} disabled={isExporting}>
                {isExporting ? 'Génération...' : 'Télécharger en PDF'}
              </Button>
              <Button onClick={handleDownloadPng} disabled={isExporting} variant="small">
                {isExporting ? 'Génération...' : 'Télécharger en PNG'}
              </Button>
              <Button onClick={handleDownloadPng} disabled={isExporting} variant="small">
                {isExporting ? 'Génération...' : 'Télécharger en PNG'}
              </Button>
            </>
          }
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div ref={sheetRef}>
          <PaperContainer>
          {/* Header */}
          <header>
            <input
              type="text"
              value={character.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nom du personnage"
              className="font-display text-ink text-[26px] mb-2 uppercase bg-transparent border-none outline-none focus:underline w-full"
            />
            <div className="grid grid-cols-3 gap-x-2.5 gap-y-1.5 text-xs">
              <TextInput
                label="Classe"
                value={character.class}
                onChange={(e) => updateField('class', e.target.value)}
                className="text-xs"
              />
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-[#7a4b36]">
                  Niveau
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={character.level}
                  onChange={(e) => {
                    const level = parseInt(e.target.value) || 1
                    updateField('level', Math.max(1, Math.min(20, level)))
                  }}
                  className="w-12 text-center font-semibold bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs focus:border-ink focus:outline-none"
                  placeholder="1"
                />
              </div>
              <TextInput
                label="Passif/Profession"
                value={character.background}
                onChange={(e) => updateField('background', e.target.value)}
                className="text-xs"
              />
              <TextInput
                label="Race"
                value={character.race}
                onChange={(e) => updateField('race', e.target.value)}
                className="text-xs"
              />
              <TextInput
                label="Alignement"
                value={character.alignment}
                onChange={(e) => updateField('alignment', e.target.value)}
                className="text-xs"
              />
              <TextInput
                label="Points d'expérience"
                value={character.xp}
                onChange={(e) => updateField('xp', e.target.value)}
                className="text-xs"
              />
            </div>
          </header>

          <Row gap="md" className="mt-3">
            {/* Left Column - Abilities */}
            <Col className="max-w-[280px]">
              <SectionHeader>Caractéristiques</SectionHeader>
              <Row gap="sm" className="mt-1 items-center">
                <FieldLabel>Bonus de maîtrise</FieldLabel>
                <Box className="max-w-[48px] text-center">
                  +{proficiencyBonus}
                </Box>
              </Row>
              <div className="flex flex-col gap-2 mt-1.5">
                {ABILITIES_ORDER.map((ability) => {
                  const skills = SKILL_DATA.filter((s) => s.ability === ability)
                  return (
                    <div key={ability} className="border border-[#c9b89c] bg-white/35 p-1.5">
                      <div className="border border-[#c9b89c] bg-white/60 px-1.5 py-1 grid grid-cols-[1fr_auto_auto] items-center gap-2 text-[13px]">
                        <div className="font-display text-ink text-xs uppercase">
                          {ABILITY_LABELS[ability]}
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={character.abilities[ability]}
                          onChange={(e) => handleAbilityChange(ability, parseInt(e.target.value) || 10)}
                          className="w-12 text-center font-semibold bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs focus:border-ink focus:outline-none"
                          placeholder="10"
                        />
                        <div className="text-right font-semibold text-xs min-w-[40px]">
                          {(() => {
                            const mod = calculateAbilityModifier(character.abilities[ability])
                            return mod >= 0 ? `+${mod}` : `${mod}`
                          })()}
                        </div>
                      </div>
                      {skills.length > 0 && (
                        <div className="mt-1 text-[11px]">
                          {skills.map((skill) => {
                            const isProficient = character.skills[skill.key] || false
                            const bonus = getSkillBonus(skill.key)
                            return (
                              <div key={skill.key} className="flex items-center gap-1 mb-0.5">
                                <input
                                  type="checkbox"
                                  checked={isProficient}
                                  onChange={() => toggleSkillProficiency(skill.key)}
                                  className="w-2.5 h-2.5"
                                />
                                <span className="flex-1">{skill.label}</span>
                                <span className="min-w-[30px] text-right font-semibold">
                                  {bonus >= 0 ? '+' : ''}{bonus}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Col>

            {/* Right Column - Combat, Traits, Equipment, Backstory */}
            <Col>
              {/* Combat Section */}
              <SectionHeader>Combat</SectionHeader>
              <Row gap="sm" className="mt-1">
                <Col>
                  <TextInput
                    label="Classe d'armure"
                    value={character.ac}
                    onChange={(e) => updateField('ac', e.target.value)}
                  />
                </Col>
                <Col>
                  <TextInput
                    label="Initiative"
                    value={character.init}
                    onChange={(e) => updateField('init', e.target.value)}
                  />
                </Col>
                <Col>
                  <TextInput
                    label="Vitesse"
                    value={character.speed}
                    onChange={(e) => updateField('speed', e.target.value)}
                  />
                </Col>
              </Row>
              <Row gap="sm" className="mt-1.5">
                <Col>
                  <TextInput
                    label="Points de vie max."
                    value={character.hpMax}
                    onChange={(e) => updateField('hpMax', e.target.value)}
                  />
                </Col>
                <Col>
                  <TextInput
                    label="PV actuels"
                    value={character.hpCurrent}
                    onChange={(e) => updateField('hpCurrent', e.target.value)}
                  />
                </Col>
                <Col>
                  <TextInput
                    label="Dés de vie"
                    value={character.hitDice}
                    onChange={(e) => updateField('hitDice', e.target.value)}
                  />
                </Col>
              </Row>

              {/* Attacks Section */}
              <SectionHeader className="mt-2.5">Attaques & sorts</SectionHeader>
              <div className="grid grid-cols-[1.2fr_0.6fr_0.9fr_1.2fr_auto] gap-1 text-[11px] mt-1">
                <FieldLabel>Nom</FieldLabel>
                <FieldLabel>Bonus</FieldLabel>
                <FieldLabel>Dégâts / type</FieldLabel>
                <FieldLabel>Notes</FieldLabel>
                <FieldLabel className="text-center">Suppr.</FieldLabel>
              </div>
              <div className="mt-1">
                {character.attacks.map((attack, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1.2fr_0.6fr_0.9fr_1.2fr_auto] gap-1 items-center mb-1"
                  >
                    <Box>
                      <input
                        type="text"
                        value={attack.name}
                        onChange={(e) => updateAttack(idx, { name: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-xs"
                        placeholder="Nom"
                      />
                    </Box>
                    <Box>
                      <input
                        type="text"
                        value={attack.bonus}
                        onChange={(e) => updateAttack(idx, { bonus: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-xs"
                        placeholder="Bonus"
                      />
                    </Box>
                    <Box>
                      <input
                        type="text"
                        value={attack.damage}
                        onChange={(e) => updateAttack(idx, { damage: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-xs"
                        placeholder="1d8+X type"
                      />
                    </Box>
                    <Box>
                      <AutoResizeTextarea
                        value={attack.notes}
                        onChange={(e) => updateAttack(idx, { notes: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-xs"
                        placeholder="Notes"
                      />
                    </Box>
                    <Button variant="small" onClick={() => removeAttack(idx)}>
                      ×
                    </Button>
                  </div>
                ))}
                <Button variant="small" onClick={addAttack} className="mt-1">
                  + Ajouter une attaque / sort
                </Button>
              </div>

              {/* Traits Section */}
              <SectionHeader className="mt-2.5">Traits & capacités</SectionHeader>
              <div className="mt-1">
                {character.traits.map((trait, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[0.8fr_1.4fr_auto] gap-1 items-center mb-1"
                  >
                    <Box>
                      <input
                        type="text"
                        value={trait.name}
                        onChange={(e) => updateTrait(idx, { name: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-xs"
                        placeholder="Nom"
                      />
                    </Box>
                    <Box>
                      <AutoResizeTextarea
                        value={trait.notes}
                        onChange={(e) => updateTrait(idx, { notes: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-xs"
                        placeholder="Notes"
                      />
                    </Box>
                    <Button variant="small" onClick={() => removeTrait(idx)}>
                      ×
                    </Button>
                  </div>
                ))}
                <Button variant="small" onClick={addTrait} className="mt-1">
                  + Ajouter un trait / capacité
                </Button>
              </div>

              {/* Equipment Section */}
              <SectionHeader className="mt-2.5">Équipement & trésor</SectionHeader>
              <Textarea
                value={character.equipment}
                onChange={(e) => updateField('equipment', e.target.value)}
                className="mt-1"
              />

              {/* Backstory Section */}
              <SectionHeader className="mt-2.5">Historique & notes</SectionHeader>
              <Textarea
                value={character.backstory}
                onChange={(e) => updateField('backstory', e.target.value)}
                className="mt-1"
              />

              {/* Description & Features Section */}
              <SectionHeader className="mt-2.5">Description & caractéristiques</SectionHeader>
              <div className="mt-1 space-y-2">
                <Textarea
                  label="Biographie / Description physique"
                  value={character.biography}
                  onChange={(e) => updateField('biography', e.target.value)}
                />
                <Textarea
                  label="Autres maîtrises & langues"
                  value={character.otherProficiencies}
                  onChange={(e) => updateField('otherProficiencies', e.target.value)}
                />
                <Textarea
                  label="Aptitudes de classe & traits raciaux"
                  value={character.featuresTraits}
                  onChange={(e) => updateField('featuresTraits', e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
            </Col>
          </Row>
          </PaperContainer>

          {/* Spellcasting Section */}
          <PaperContainer variant="spell-block">
          <SectionHeader>Lancer de sorts</SectionHeader>
          <Row gap="md" className="mt-1.5 flex-wrap">
            <div className="min-w-[160px]">
              <Select
                label="Caractéristique de lancer"
                value={character.spellcastingAttribute}
                onChange={(e) => updateField('spellcastingAttribute', e.target.value as 'INT' | 'WIS' | 'CHA' | 'None')}
                options={[
                  { value: 'None', label: 'Aucune' },
                  { value: 'INT', label: 'Intelligence' },
                  { value: 'WIS', label: 'Sagesse' },
                  { value: 'CHA', label: 'Charisme' },
                ]}
              />
            </div>
            <div className="min-w-[140px]">
              <div className="flex flex-col gap-1">
                <FieldLabel>DD du sort</FieldLabel>
                <Box className="bg-white/60">
                  {spellDC ? spellDC : '—'}
                </Box>
              </div>
            </div>
            <div className="min-w-[160px]">
              <div className="flex flex-col gap-1">
                <FieldLabel>Bonus d'attaque</FieldLabel>
                <Box className="bg-white/60">
                  {spellAttackBonus ? (spellAttackBonus >= 0 ? `+${spellAttackBonus}` : `${spellAttackBonus}`) : '—'}
                </Box>
              </div>
            </div>
          </Row>

          <div className="mt-2.5">
            <FieldLabel>Sorts et emplacements par niveau</FieldLabel>
            <div className="mt-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                <div
                  key={level}
                  className="mb-3 border border-[#c9b89c] p-2 bg-white/40"
                >
                  <SectionHeader as="h4" className="text-sm mb-1.5">
                    {level === 0 ? 'Niveau 0 (Tour de magie / Cantrips)' : `Niveau ${level}`}
                  </SectionHeader>

                  {level >= 1 && (
                    <div className="flex gap-1 items-center mb-1.5 text-xs">
                      <span>Nombre d'utilisation: </span>
                      <Button
                        variant="small"
                        onClick={() =>
                          updateSpellSlot(
                            level,
                            'used',
                            Math.max(0, (character.spellSlots[level]?.used || 0) - 1)
                          )
                        }
                      >
                        -
                      </Button>
                      <span className="min-w-[20px] text-center">
                        {character.spellSlots[level]?.used || 0}
                      </span>
                      <Button
                        variant="small"
                        onClick={() =>
                          updateSpellSlot(
                            level,
                            'used',
                            Math.min(
                              character.spellSlots[level]?.total || 0,
                              (character.spellSlots[level]?.used || 0) + 1
                            )
                          )
                        }
                      >
                        +
                      </Button>
                      <span> / </span>
                      <input
                        type="number"
                        min="0"
                        value={character.spellSlots[level]?.total || 0}
                        onChange={(e) =>
                          updateSpellSlot(level, 'total', parseInt(e.target.value) || 0)
                        }
                        className="w-[50px] px-1 py-1 border border-[#bda68a] bg-transparent text-xs"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-[40px_1fr_60px_1fr_auto] gap-1.5 text-[11px] mb-1.5">
                    <FieldLabel>Préparé</FieldLabel>
                    <FieldLabel>Nom</FieldLabel>
                    <FieldLabel>Niv.</FieldLabel>
                    <FieldLabel>Notes</FieldLabel>
                    <FieldLabel className="text-center">Suppr.</FieldLabel>
                  </div>

                  <div className="border border-[#c9b89c] bg-white/40 p-1.5 text-[11px] max-h-[200px] overflow-y-auto">
                    {(spellsByLevel[level] || []).map((spell) => {
                      const globalIdx = character.spells.findIndex(
                        (s) => s === spell
                      )
                      return (
                        <div
                          key={globalIdx}
                          className="grid grid-cols-[40px_1fr_60px_1fr_auto] gap-1.5 items-center mb-1"
                        >
                          <input
                            type="checkbox"
                            checked={spell.prepared}
                            onChange={(e) =>
                              updateSpell(globalIdx, { prepared: e.target.checked })
                            }
                            className="w-2.5 h-2.5"
                          />
                          <Box>
                            <input
                              type="text"
                              value={spell.name}
                              onChange={(e) => updateSpell(globalIdx, { name: e.target.value })}
                              className="w-full bg-transparent border-none outline-none text-xs"
                              placeholder="Nom du sort"
                            />
                          </Box>
                          <Box className="text-center">{spell.level}</Box>
                          <Box>
                            <AutoResizeTextarea
                              value={spell.notes}
                              onChange={(e) => updateSpell(globalIdx, { notes: e.target.value })}
                              className="w-full bg-transparent border-none outline-none text-xs"
                              placeholder="Notes"
                            />
                          </Box>
                          <Button
                            variant="small"
                            onClick={() => removeSpell(globalIdx)}
                          >
                            ×
                          </Button>
                        </div>
                      )
                    })}
                  </div>

                  <Button
                    variant="small"
                    onClick={() => addSpell(level)}
                    className="mt-1"
                  >
                    + Ajouter sort
                  </Button>
                </div>
              ))}
            </div>
          </div>
          </PaperContainer>
        </div>
      </div>
    </div>
  )
}
