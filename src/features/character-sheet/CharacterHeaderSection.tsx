import { useRef, useState, type ChangeEvent } from 'react'
import { Button, Select, TextInput } from '@/components/ui'
import { useOutsideClick } from '@/hooks'
import { CLASSES_2024 } from '@/data/classTables2024'
import { cn } from '@/utils/cn'

type SelectOption = {
  value: string
  label: string
}

type CharacterHeaderSectionProps = {
  name: string
  characterClass: string
  subclass: string
  level: number
  background: string
  race: string
  alignment: string
  xp: string
  portraitUrl: string | null
  isUploadingImage: boolean
  classOptions: SelectOption[]
  subclassOptions: string[]
  onNameChange: (value: string) => void
  onClassChange: (value: string) => void
  onSubclassChange: (value: string) => void
  onLevelChange: (value: number) => void
  onBackgroundChange: (value: string) => void
  onRaceChange: (value: string) => void
  onAlignmentChange: (value: string) => void
  onXpChange: (value: string) => void
  onShortRest: () => void
  onLongRest: () => void
  onPortraitSelected: (dataUrl: string) => void
  onPortraitDelete: () => void
}

export function CharacterHeaderSection({
  name,
  characterClass,
  subclass,
  level,
  background,
  race,
  alignment,
  xp,
  portraitUrl,
  isUploadingImage,
  classOptions,
  subclassOptions,
  onNameChange,
  onClassChange,
  onSubclassChange,
  onLevelChange,
  onBackgroundChange,
  onRaceChange,
  onAlignmentChange,
  onXpChange,
  onShortRest,
  onLongRest,
  onPortraitSelected,
  onPortraitDelete,
}: CharacterHeaderSectionProps) {
  const portraitInputRef = useRef<HTMLInputElement>(null)
  const [openPortraitMenu, setOpenPortraitMenu] = useState(false)

  useOutsideClick({
    isActive: openPortraitMenu,
    onOutsideClick: () => setOpenPortraitMenu(false),
    ignoreSelector: '[data-portrait-menu]',
  })

  const handlePortraitClick = () => {
    portraitInputRef.current?.click()
  }

  const handlePortraitUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        onPortraitSelected(dataUrl)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const subclassLabel = CLASSES_2024[characterClass]?.subclassLabel ?? 'Sous-classe'

  return (
    <header className="grid grid-cols-[110px_1fr] gap-4 items-start">
      <div className="flex flex-col items-start gap-2">
        <div
          className={cn(
            'w-[110px] h-[150px] bg-gradient-to-br from-[#d2b48c] via-paper to-[#c9ad8f] border-2 border-ink flex items-center justify-center text-ink font-display text-[11px] uppercase overflow-hidden relative cursor-pointer',
            isUploadingImage && 'opacity-50 cursor-wait'
          )}
          onClick={handlePortraitClick}
        >
          {isUploadingImage ? (
            <span className="text-[10px]">Uploading...</span>
          ) : portraitUrl ? (
            <img
              src={portraitUrl}
              alt="Portrait"
              className="w-full h-full object-cover block"
              draggable={false}
            />
          ) : (
            <span>Portrait</span>
          )}
        </div>
        <input
          ref={portraitInputRef}
          type="file"
          accept="image/*"
          onChange={handlePortraitUpload}
          className="hidden"
        />
        <div className="relative" data-portrait-menu onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setOpenPortraitMenu((prev) => !prev)
            }}
            className="text-xs px-1"
          >
            ⋯
          </button>
          {openPortraitMenu && (
            <div className="absolute left-0 mt-1 z-10 bg-white border border-[#c9b89c] rounded shadow-sm text-xs min-w-[120px]">
              <button
                type="button"
                onClick={() => {
                  onPortraitDelete()
                  setOpenPortraitMenu(false)
                }}
                className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4] disabled:opacity-50"
                disabled={!portraitUrl}
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Nom du personnage"
          className="font-display text-ink text-[26px] mb-2 uppercase bg-transparent border-none outline-none focus:underline w-full"
        />
        <div className="grid grid-cols-4 gap-x-2.5 gap-y-1.5 text-xs">
          <Select
            label="Classe"
            value={characterClass}
            onChange={(e) => onClassChange(e.target.value)}
            options={classOptions}
          />
          <Select
            label={subclassLabel}
            value={subclass}
            onChange={(e) => onSubclassChange(e.target.value)}
            options={subclassOptions.map((option) => ({
              value: option,
              label: option,
            }))}
            disabled={level < 3}
          />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-[#7a4b36]">
              Niveau
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={level}
              onChange={(e) => {
                const nextLevel = parseInt(e.target.value) || 1
                onLevelChange(Math.max(1, Math.min(20, nextLevel)))
              }}
              className="w-12 text-center font-semibold bg-transparent border border-[#bda68a] rounded px-1 py-0.5 text-xs focus:border-ink focus:outline-none"
              placeholder="1"
            />
          </div>
          <TextInput
            label="Passif/Profession"
            value={background}
            onChange={(e) => onBackgroundChange(e.target.value)}
            className="text-xs"
          />
          <TextInput
            label="Race"
            value={race}
            onChange={(e) => onRaceChange(e.target.value)}
            className="text-xs"
          />
          <TextInput
            label="Alignement"
            value={alignment}
            onChange={(e) => onAlignmentChange(e.target.value)}
            className="text-xs"
          />
          <TextInput
            label="Points d'expérience"
            value={xp}
            onChange={(e) => onXpChange(e.target.value)}
            className="text-xs"
          />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="small" onClick={onShortRest}>
            Repos court
          </Button>
          <Button variant="small" onClick={onLongRest}>
            Repos long
          </Button>
        </div>
      </div>
    </header>
  )
}
