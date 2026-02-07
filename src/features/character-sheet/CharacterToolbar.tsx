import { useRef, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthButton } from '@/components/auth/AuthButton'
import { Button, Select, Toolbar } from '@/components/ui'
import { SPELL_LOCALE_OPTIONS, type SpellLocale } from '@/utils/spellLocale'

type CharacterToolbarProps = {
  isExporting: boolean
  isSaving: boolean
  spellLocale: SpellLocale
  onSpellLocaleChange: (value: SpellLocale) => void
  onExport: () => void
  onImportFile: (event: ChangeEvent<HTMLInputElement>) => void
  onReset: () => void
  onDownloadPdf: () => void
  onDownloadPng: () => void
  onSave: () => void
}

export function CharacterToolbar({
  isExporting,
  isSaving,
  spellLocale,
  onSpellLocaleChange,
  onExport,
  onImportFile,
  onReset,
  onDownloadPdf,
  onDownloadPng,
  onSave,
}: CharacterToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Toolbar
      left={
        <Link to="/">
          <Button>⬅ Retour</Button>
        </Link>
      }
      right={
        <>
          <AuthButton />
          <div className="opacity-80">
            <Select
              value={spellLocale}
              onChange={(e) => onSpellLocaleChange(e.target.value as SpellLocale)}
              options={SPELL_LOCALE_OPTIONS}
              className="text-[10px] min-h-[20px] w-[140px]"
              aria-label="Langue des sorts"
            />
          </div>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button onClick={onExport}>Exporter la fiche (JSON)</Button>
          <Button onClick={() => fileInputRef.current?.click()}>
            Importer une fiche
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={onImportFile}
            className="hidden"
          />
          <Button onClick={onReset} variant="small">
            Reset
          </Button>
          <Button onClick={onDownloadPdf} disabled={isExporting}>
            {isExporting ? 'Génération...' : 'Télécharger en PDF'}
          </Button>
          <Button onClick={onDownloadPng} disabled={isExporting} variant="small">
            {isExporting ? 'Génération...' : 'Télécharger en PNG'}
          </Button>
        </>
      }
    />
  )
}
