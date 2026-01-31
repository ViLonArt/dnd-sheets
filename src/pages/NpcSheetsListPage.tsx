import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthButton } from '@/components/auth/AuthButton'
import { PaperContainer, Heading, Button } from '@/components/ui'
import { listNpcSheets, type SheetListItem } from '@/services/sheetService'

export default function NpcSheetsListPage() {
  const [sheets, setSheets] = useState<SheetListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadSheets = async () => {
      try {
        setIsLoading(true)
        const result = await listNpcSheets()
        if (isMounted) {
          setSheets(result)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load NPC sheets')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSheets()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen p-6 bg-gray-200">
      <div className="max-w-5xl mx-auto">
        <PaperContainer>
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Heading size="lg" className="mb-1">
                  Fiches PNJ / Monstres
                </Heading>
                <p className="text-sm text-[#3e2a1d]">
                  Consultez toutes les fiches PNJ disponibles.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/">
                  <Button variant="small">Retour à l&apos;accueil</Button>
                </Link>
                <AuthButton />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/npc/new">
                <Button>Créer une fiche PNJ</Button>
              </Link>
            </div>

            {isLoading && (
              <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                Chargement des fiches...
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {!isLoading && !error && sheets.length === 0 && (
              <div className="text-sm text-[#3e2a1d]">Aucune fiche PNJ disponible.</div>
            )}

            {!isLoading && !error && sheets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sheets.map((sheet) => {
                  const identifier = sheet.slug || sheet.id
                  return (
                    <Link key={sheet.id} to={`/npc/${identifier}`} className="block group">
                      <article className="border border-ink/40 bg-paper/85 p-3 rounded flex flex-col gap-3 transition-shadow group-hover:shadow-md">
                        <div className="w-full aspect-[8/11] bg-[#f3e2c8] border border-ink/30 rounded overflow-hidden flex items-center justify-center text-xs text-[#6b4b33]">
                          {sheet.portrait ? (
                            <img
                              src={sheet.portrait}
                              alt={sheet.name}
                              className="w-full h-full object-cover block"
                              loading="lazy"
                            />
                          ) : (
                            <span>Pas de portrait</span>
                          )}
                        </div>
                        <div className="font-semibold text-ink text-sm">{sheet.name || 'Sans nom'}</div>
                      </article>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </PaperContainer>
      </div>
    </div>
  )
}
