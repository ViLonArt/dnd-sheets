import { Link } from 'react-router-dom'
import { PaperContainer, Heading, Button } from '@/components/ui'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <PaperContainer>
          <div className="text-center mb-6">
            <Heading size="lg" className="mb-2">
              Outil de Fiches D&D 5e
            </Heading>
            <p className="text-[#5e3b2a] italic mb-6">
              Créez rapidement des fiches de PNJ et de personnages pour vos parties de jeu de rôle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            {/* NPC Sheet Card */}
            <article className="border border-ink/40 bg-paper/85 p-5 rounded flex flex-col gap-2">
              <Heading as="h2" size="md" className="mb-1">
                Fiche PNJ / Monstre
              </Heading>
              <p className="text-sm text-[#3e2a1d] mb-2 flex-grow">
                Portrait interactif, attributs, compétences, aptitudes spéciales et actions. Export PNG et sauvegarde/chargement JSON.
              </p>
              <div className="mt-auto">
                <Link to="/npc">
                  <Button className="w-full">Créer / modifier une fiche PNJ</Button>
                </Link>
              </div>
            </article>

            {/* Character Sheet Card */}
            <article className="border border-ink/40 bg-paper/85 p-5 rounded flex flex-col gap-2">
              <Heading as="h2" size="md" className="mb-1">
                Fiche PJ (Joueur)
              </Heading>
              <p className="text-sm text-[#3e2a1d] mb-2 flex-grow">
                Fiche inspirée de la feuille officielle 5e : caractéristiques, compétences, combat, traits et historique.
              </p>
              <div className="mt-auto">
                <Link to="/character">
                  <Button className="w-full">Créer / modifier une fiche PJ</Button>
                </Link>
              </div>
            </article>
          </div>

          <p className="text-center mt-5 text-xs text-[#6b4b33]">
            Utilisez « Exporter la fiche (JSON) » pour sauvegarder, puis « Importer une fiche » pour reprendre une partie.
          </p>
        </PaperContainer>
      </div>
    </div>
  )
}
