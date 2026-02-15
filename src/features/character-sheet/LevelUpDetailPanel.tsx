import type { Locale } from '@/utils/advancementTypes'
import { RULESET_2024 } from '@/utils/advancementEngine'
import { SKILL_DATA } from '@/features/character-sheet/constants'
import { getSpellById } from '@/utils/advancementMapper'
import { getClassFeaturesForLevel } from '@/data/classFeatureRegistry'
import { BARD_SUBCLASS_FEATURES } from '@/data/bardSubclassFeatures'
import { t } from '@/utils/i18n'
import { Box } from '@/components/ui'

export type DetailSelection =
  | { type: 'class'; id: string }
  | { type: 'species'; id: string }
  | { type: 'background'; id: string }
  | { type: 'subclass'; id: string }
  | { type: 'spell'; id: string }
  | { type: 'feat'; id: string }
  | null

type LevelUpDetailPanelProps = {
  selection: DetailSelection
  locale: Locale
  classLevel?: number
}

function getBackgroundDescription(bg: { description?: Record<string, string>; descriptionKey?: string }, locale: Locale) {
  if (bg.description?.[locale]) return bg.description[locale]
  if (bg.descriptionKey) return t(bg.descriptionKey, locale)
  return ''
}

export function LevelUpDetailPanel({ selection, locale, classLevel = 1 }: LevelUpDetailPanelProps) {
  if (!selection) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#8b7355] text-sm italic p-8">
        {t('ui.levelUp.selectForDetails', locale) || 'Select an option to view details'}
      </div>
    )
  }

  if (selection.type === 'class') {
    const cl = RULESET_2024.classes[selection.id]
    if (!cl) return null
    const features = getClassFeaturesForLevel(selection.id, classLevel).filter((f) => f.level <= classLevel)
    return (
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        <h3 className="font-display text-lg uppercase text-[#5c3b22]">
          {t(cl.nameKey, locale)}
        </h3>
        <div className="space-y-2 text-xs text-[#5c3b22]">
          <div><span className="font-medium">Hit Die:</span> d{cl.hitDie}</div>
          <div><span className="font-medium">Spellcasting:</span> {cl.spellcasting ?? 'None'}</div>
          {cl.subclassLevel != null && (
            <div><span className="font-medium">Subclass:</span> Level {cl.subclassLevel}</div>
          )}
        </div>
        {features.length > 0 && (
          <div>
            <h4 className="font-semibold text-[#5c3b22] mb-2">Features</h4>
            <div className="space-y-2">
              {features.map((f) => (
                <Box key={f.id} className="bg-white/60 p-2">
                  <div className="font-medium text-[#5c3b22]">{t(f.nameKey, locale)}</div>
                  {f.descriptionKey && (
                    <div className="text-[11px] mt-1 text-[#6b5344]">{t(f.descriptionKey, locale)}</div>
                  )}
                </Box>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (selection.type === 'species') {
    const sp = RULESET_2024.species[selection.id]
    if (!sp) return null
    const traits = (sp.traits ?? []).filter((trait: { level: number }) => trait.level <= classLevel)
    return (
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        <h3 className="font-display text-lg uppercase text-[#5c3b22]">
          {t(sp.nameKey, locale)}
        </h3>
        {traits.length > 0 && (
          <div>
            <h4 className="font-semibold text-[#5c3b22] mb-2">Traits</h4>
            <div className="space-y-2">
              {traits.map((trait: { id: string; nameKey: string; descriptionKey?: string }) => (
                <Box key={trait.id} className="bg-white/60 p-2">
                  <div className="font-medium text-[#5c3b22]">{t(trait.nameKey, locale)}</div>
                  {trait.descriptionKey && (
                    <div className="text-[11px] mt-1 text-[#6b5344]">{t(trait.descriptionKey, locale)}</div>
                  )}
                </Box>
              ))}
            </div>
          </div>
        )}
        {(sp.choices ?? []).length > 0 && (
          <div>
            <h4 className="font-semibold text-[#5c3b22] mb-2">Choices</h4>
            <div className="space-y-2 text-xs text-[#6b5344]">
              {(sp.choices ?? []).map((ch: { id: string; nameKey: string }) => (
                <div key={ch.id}>• {t(ch.nameKey, locale)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (selection.type === 'background') {
    const bg = RULESET_2024.backgrounds[selection.id]
    if (!bg) return null
    const desc = getBackgroundDescription(bg, locale)
    const skills = (bg.skills ?? []) as string[]
    const toolProficiency = (bg as { toolProficiency?: string }).toolProficiency
    const abilityOptions = (bg.abilityOptions ?? bg.abilityChoices ?? []) as string[]
    const abilityLabels: Record<string, string> = {
      str: t('ability.str', locale), dex: t('ability.dex', locale), con: t('ability.con', locale),
      int: t('ability.int', locale), wis: t('ability.wis', locale), cha: t('ability.cha', locale),
    }
    return (
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        <h3 className="font-display text-lg uppercase text-[#5c3b22]">
          {t(bg.nameKey, locale)}
        </h3>
        {desc && (
          <p className="text-xs text-[#6b5344]">{desc}</p>
        )}
        <div className="space-y-2 text-xs">
          {skills.length > 0 && (
            <div>
              <span className="font-medium text-[#5c3b22]">Skills:</span>{' '}
              {skills.map((s) => SKILL_DATA.find((sk) => sk.key === s)?.label ?? s).join(', ')}
            </div>
          )}
          {toolProficiency && (
            <div>
              <span className="font-medium text-[#5c3b22]">Tool:</span> {toolProficiency}
            </div>
          )}
          {abilityOptions.length > 0 && (
            <div>
              <span className="font-medium text-[#5c3b22]">Ability options:</span>{' '}
              {abilityOptions.map((a) => abilityLabels[a] ?? a).join(', ')}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (selection.type === 'subclass') {
    const sub = RULESET_2024.subclasses[selection.id]
    if (!sub) return null
    const classId = sub.classId
    const features = (BARD_SUBCLASS_FEATURES[selection.id] ?? []).filter(
      (f) => f.level <= classLevel
    )
    const weaponProfs = (sub as { weaponProficiencies?: string[] }).weaponProficiencies
    const armorProfs = (sub as { armorProficiencies?: string[] }).armorProficiencies
    return (
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        <h3 className="font-display text-lg uppercase text-[#5c3b22]">
          {t(sub.nameKey, locale)}
        </h3>
        {(weaponProfs?.length ?? 0) > 0 && (
          <div className="text-xs">
            <span className="font-medium text-[#5c3b22]">Weapon proficiencies:</span>{' '}
            {weaponProfs!.join(', ')}
          </div>
        )}
        {(armorProfs?.length ?? 0) > 0 && (
          <div className="text-xs">
            <span className="font-medium text-[#5c3b22]">Armor proficiencies:</span>{' '}
            {armorProfs!.join(', ')}
          </div>
        )}
        {features.length > 0 && (
          <div>
            <h4 className="font-semibold text-[#5c3b22] mb-2">Features</h4>
            <div className="space-y-2">
              {features.map((f) => (
                <Box key={f.id} className="bg-white/60 p-2">
                  <div className="font-medium text-[#5c3b22]">{t(f.nameKey, locale)}</div>
                  {f.descriptionKey && (
                    <div className="text-[11px] mt-1 text-[#6b5344]">{t(f.descriptionKey, locale)}</div>
                  )}
                </Box>
              ))}
            </div>
          </div>
        )}
        {features.length === 0 && !weaponProfs?.length && !armorProfs?.length && (
          <p className="text-xs text-[#8b7355] italic">
            {classId ? t(RULESET_2024.classes[classId]?.nameKey ?? '', locale) : ''} subclass.
          </p>
        )}
      </div>
    )
  }

  if (selection.type === 'feat') {
    const featId = selection.id === 'asi' ? 'ability-score-improvement' : selection.id
    const feat = RULESET_2024.feats[featId]
    if (!feat) return null
    return (
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        <h3 className="font-display text-lg uppercase text-[#5c3b22]">
          {t(feat.nameKey, locale)}
        </h3>
        {feat.descriptionKey && (
          <p className="text-xs text-[#6b5344] leading-relaxed whitespace-pre-wrap">
            {t(feat.descriptionKey, locale)}
          </p>
        )}
      </div>
    )
  }

  if (selection.type === 'spell') {
    const spell = getSpellById(selection.id, locale)
    if (!spell) return null
    const levelLabel = Number(spell.level) === 0 ? 'Cantrip' : `Level ${spell.level}`
    return (
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        <h3 className="font-display text-lg uppercase text-[#5c3b22]">
          {spell.name}
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="font-medium text-[#5c3b22]">{levelLabel}</span>
          {spell.school && (
            <span className="text-[#6b5344]">{spell.school}</span>
          )}
          {spell.range && <span>{spell.range}</span>}
          {spell.duration && <span>{spell.duration}</span>}
          {spell.components && <span>{spell.components}</span>}
          {spell.concentration && (
            <span className="text-amber-700">{t('term.concentration', locale) || 'Concentration'}</span>
          )}
          {spell.ritual && (
            <span className="text-amber-700">{t('term.ritual', locale) || 'Ritual'}</span>
          )}
        </div>
        {spell.description && (
          <p className="text-xs text-[#6b5344] leading-relaxed whitespace-pre-wrap">
            {spell.description}
          </p>
        )}
      </div>
    )
  }

  return null
}
