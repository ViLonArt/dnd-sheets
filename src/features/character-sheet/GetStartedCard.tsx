import { useRef, type ChangeEvent } from 'react'
import { PaperContainer, Button, Heading } from '@/components/ui'

type GetStartedCardProps = {
  onCreateNew: () => void
  onImportFile: (event: ChangeEvent<HTMLInputElement>) => void
  locale: 'en' | 'fr'
}

const CONTENT = {
  en: {
    title: 'Get Started',
    subtitle: 'Create a new character or import an existing one from a JSON file.',
    createNew: 'Create New Character',
    importJson: 'Import JSON',
    importHint: 'Standard D&D character sheet JSON format',
  },
  fr: {
    title: 'Commencer',
    subtitle: 'Créez un nouveau personnage ou importez-en un depuis un fichier JSON.',
    createNew: 'Créer un personnage',
    importJson: 'Importer JSON',
    importHint: 'Format JSON standard de fiche D&D',
  },
} as const

export function GetStartedCard({
  onCreateNew,
  onImportFile,
  locale,
}: GetStartedCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = CONTENT[locale]

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    onImportFile(e)
    e.target.value = ''
  }

  return (
    <PaperContainer className="max-w-xl mx-auto">
      <div className="text-center py-12 px-6">
        <Heading size="lg" className="mb-2 text-[#5c3b22]">
          {t.title}
        </Heading>
        <p className="text-sm text-[#7a4b36] mb-8 max-w-md mx-auto">
          {t.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onCreateNew}
            className="px-6 py-3 text-sm font-semibold bg-[#7a4b36] text-white border-[#5c3b22] hover:bg-[#8b5a42]"
          >
            {t.createNew}
          </Button>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
              aria-label={t.importJson}
            />
            <Button
              onClick={handleImportClick}
              variant="default"
              className="px-6 py-3 border-[#c9b89c] bg-white/80 hover:bg-[#f3e2c8]"
            >
              {t.importJson}
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-[#9a7b5a] mt-4">
          {t.importHint}
        </p>
      </div>
    </PaperContainer>
  )
}
