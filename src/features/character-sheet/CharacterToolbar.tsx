import { useRef, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthButton } from '@/components/auth/AuthButton'
import { Button, Toolbar } from '@/components/ui'

type CharacterToolbarProps = {
  isExporting: boolean
  isSaving: boolean
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
        <Link to="/character">
          <Button>⬅ Retour à la liste</Button>
        </Link>
      }
      right={
        <>
          <AuthButton />
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
