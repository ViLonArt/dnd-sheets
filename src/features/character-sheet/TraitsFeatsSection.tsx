import { useState } from 'react'
import type { DragEvent } from 'react'
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
  const [draggingTraitIndex, setDraggingTraitIndex] = useState<number | null>(null)
  const [dragOverTraitIndex, setDragOverTraitIndex] = useState<number | null>(null)
  const [dragOverTraitEdge, setDragOverTraitEdge] = useState<'top' | 'bottom' | null>(null)
  const [draggingFeatIndex, setDraggingFeatIndex] = useState<number | null>(null)
  const [dragOverFeatIndex, setDragOverFeatIndex] = useState<number | null>(null)
  const [dragOverFeatEdge, setDragOverFeatEdge] = useState<'top' | 'bottom' | null>(null)

  const resetTraitDragState = () => {
    setDraggingTraitIndex(null)
    setDragOverTraitIndex(null)
    setDragOverTraitEdge(null)
  }

  const resetFeatDragState = () => {
    setDraggingFeatIndex(null)
    setDragOverFeatIndex(null)
    setDragOverFeatEdge(null)
  }

  const reorderSpeciesTraits = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    const next = [...speciesTraits]
    const [moved] = next.splice(fromIndex, 1)
    if (!moved) return
    const insertIndex = fromIndex < toIndex ? Math.max(0, toIndex - 1) : toIndex
    next.splice(insertIndex, 0, moved)
    onSpeciesTraitsChange(next)
  }

  const reorderFeats = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    const next = [...feats]
    const [moved] = next.splice(fromIndex, 1)
    if (!moved) return
    const insertIndex = fromIndex < toIndex ? Math.max(0, toIndex - 1) : toIndex
    next.splice(insertIndex, 0, moved)
    onFeatsChange(next)
  }

  const handleTraitDragStart = (index: number) => (event: DragEvent<HTMLElement>) => {
    setDraggingTraitIndex(index)
    setDragOverTraitIndex(null)
    setDragOverTraitEdge(null)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  const handleTraitDragOver = (index: number) => (event: DragEvent<HTMLElement>) => {
    if (draggingTraitIndex === null || draggingTraitIndex === index) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const isTop = event.clientY - rect.top < rect.height / 2
    setDragOverTraitIndex(index)
    setDragOverTraitEdge(isTop ? 'top' : 'bottom')
    event.dataTransfer.dropEffect = 'move'
  }

  const handleTraitDrop = (index: number) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    if (draggingTraitIndex === null || draggingTraitIndex === index) {
      resetTraitDragState()
      return
    }
    const insertIndex = dragOverTraitEdge === 'bottom' ? index + 1 : index
    reorderSpeciesTraits(draggingTraitIndex, insertIndex)
    resetTraitDragState()
  }

  const handleFeatDragStart = (index: number) => (event: DragEvent<HTMLElement>) => {
    setDraggingFeatIndex(index)
    setDragOverFeatIndex(null)
    setDragOverFeatEdge(null)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  const handleFeatDragOver = (index: number) => (event: DragEvent<HTMLElement>) => {
    if (draggingFeatIndex === null || draggingFeatIndex === index) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const isTop = event.clientY - rect.top < rect.height / 2
    setDragOverFeatIndex(index)
    setDragOverFeatEdge(isTop ? 'top' : 'bottom')
    event.dataTransfer.dropEffect = 'move'
  }

  const handleFeatDrop = (index: number) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    if (draggingFeatIndex === null || draggingFeatIndex === index) {
      resetFeatDragState()
      return
    }
    const insertIndex = dragOverFeatEdge === 'bottom' ? index + 1 : index
    reorderFeats(draggingFeatIndex, insertIndex)
    resetFeatDragState()
  }
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
                className={`grid grid-cols-[auto_1fr_1.4fr_auto] gap-1 items-start mb-1 ${
                  dragOverTraitIndex === idx && dragOverTraitEdge === 'top'
                    ? 'border-t-2 border-t-[#7a4b36]'
                    : dragOverTraitIndex === idx && dragOverTraitEdge === 'bottom'
                      ? 'border-b-2 border-b-[#7a4b36]'
                      : ''
                } ${draggingTraitIndex === idx ? 'opacity-60' : ''}`}
                onDragOver={handleTraitDragOver(idx)}
                onDrop={handleTraitDrop(idx)}
                onDragLeave={() => {
                  if (dragOverTraitIndex === idx) {
                    setDragOverTraitIndex(null)
                    setDragOverTraitEdge(null)
                  }
                }}
              >
                <span
                  role="button"
                  aria-label="Réordonner le trait"
                  draggable
                  onDragStart={handleTraitDragStart(idx)}
                  onDragEnd={resetTraitDragState}
                  className="text-xs text-[#7a4b36] cursor-grab select-none"
                >
                  ⋮⋮
                </span>
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
                className={`grid grid-cols-[auto_1fr_1.4fr_auto] gap-1 items-start mb-1 ${
                  dragOverFeatIndex === idx && dragOverFeatEdge === 'top'
                    ? 'border-t-2 border-t-[#7a4b36]'
                    : dragOverFeatIndex === idx && dragOverFeatEdge === 'bottom'
                      ? 'border-b-2 border-b-[#7a4b36]'
                      : ''
                } ${draggingFeatIndex === idx ? 'opacity-60' : ''}`}
                onDragOver={handleFeatDragOver(idx)}
                onDrop={handleFeatDrop(idx)}
                onDragLeave={() => {
                  if (dragOverFeatIndex === idx) {
                    setDragOverFeatIndex(null)
                    setDragOverFeatEdge(null)
                  }
                }}
              >
                <span
                  role="button"
                  aria-label="Réordonner le don"
                  draggable
                  onDragStart={handleFeatDragStart(idx)}
                  onDragEnd={resetFeatDragState}
                  className="text-xs text-[#7a4b36] cursor-grab select-none"
                >
                  ⋮⋮
                </span>
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
