import { AutoResizeTextarea, Box, Button, SectionHeader } from '@/components/ui'
import type { Feat, SpeciesTrait } from '@/types/character'

type TraitsFeatsSectionProps = {
  speciesTraits: SpeciesTrait[]
  feats: Feat[]
  onSpeciesTraitsChange: (next: SpeciesTrait[]) => void
  onFeatsChange: (next: Feat[]) => void
}

export function TraitsFeatsSection({
  speciesTraits,
  feats,
  onSpeciesTraitsChange,
  onFeatsChange,
}: TraitsFeatsSectionProps) {
  const addSpeciesTrait = () => {
    onSpeciesTraitsChange([...speciesTraits, { name: '', description: '' }])
  }

  const updateSpeciesTrait = (index: number, updates: Partial<SpeciesTrait>) => {
    const next = [...speciesTraits]
    const current = next[index]
    if (!current) return
    next[index] = {
      name: updates.name ?? current.name,
      description: updates.description ?? current.description,
    }
    onSpeciesTraitsChange(next)
  }

  const removeSpeciesTrait = (index: number) => {
    onSpeciesTraitsChange(speciesTraits.filter((_, i) => i !== index))
  }

  const addFeat = () => {
    onFeatsChange([...feats, { name: '', description: '' }])
  }

  const updateFeat = (index: number, updates: Partial<Feat>) => {
    const next = [...feats]
    const current = next[index]
    if (!current) return
    next[index] = {
      name: updates.name ?? current.name,
      description: updates.description ?? current.description,
    }
    onFeatsChange(next)
  }

  const removeFeat = (index: number) => {
    onFeatsChange(feats.filter((_, i) => i !== index))
  }

  return (
    <div className="mt-3 border border-[#c9b89c] bg-white/60 rounded p-2 shadow-sm h-auto">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <SectionHeader>Traits d'Espèce</SectionHeader>
          <div className="mt-1">
            {speciesTraits.map((trait, idx) => (
              <div
                key={`species-${idx}`}
                className="grid grid-cols-[1fr_1.4fr_auto] gap-1 items-start mb-1"
              >
                <Box>
                  <AutoResizeTextarea
                    value={trait.name}
                    onChange={(e) => updateSpeciesTrait(idx, { name: e.target.value })}
                    className="w-full bg-transparent border-none outline-none font-bold leading-tight"
                    placeholder="Trait"
                  />
                </Box>
                <Box>
                  <AutoResizeTextarea
                    value={trait.description}
                    onChange={(e) => updateSpeciesTrait(idx, { description: e.target.value })}
                    className="w-full bg-transparent border-none outline-none text-xs"
                    placeholder="Description"
                  />
                </Box>
                <Button variant="small" onClick={() => removeSpeciesTrait(idx)}>
                  ×
                </Button>
              </div>
            ))}
            <Button variant="small" onClick={addSpeciesTrait} className="mt-1">
              + Ajouter un trait
            </Button>
          </div>
        </div>
        <div>
          <SectionHeader>Dons</SectionHeader>
          <div className="mt-1">
            {feats.map((feat, idx) => (
              <div
                key={`feat-${idx}`}
                className="grid grid-cols-[1fr_1.4fr_auto] gap-1 items-start mb-1"
              >
                <Box>
                  <AutoResizeTextarea
                    value={feat.name}
                    onChange={(e) => updateFeat(idx, { name: e.target.value })}
                    className="w-full bg-transparent border-none outline-none font-bold leading-tight"
                    placeholder="Don"
                  />
                </Box>
                <Box>
                  <AutoResizeTextarea
                    value={feat.description}
                    onChange={(e) => updateFeat(idx, { description: e.target.value })}
                    className="w-full bg-transparent border-none outline-none text-xs"
                    placeholder="Description"
                  />
                </Box>
                <Button variant="small" onClick={() => removeFeat(idx)}>
                  ×
                </Button>
              </div>
            ))}
            <Button variant="small" onClick={addFeat} className="mt-1">
              + Ajouter un don
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
