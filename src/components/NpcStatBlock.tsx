import type { Npc } from '@/types/npc'
import { calculateAbilityModifier } from '@/types/abilities'
import { ABILITIES_ORDER, ABILITY_LABELS } from '@/features/character-sheet/constants'
import { Button } from '@/components/ui'
import paperTexture from '@/assets/paper-texture.jpg';

interface NpcStatBlockProps {
  npc: Npc
  onEdit?: () => void
}

export function NpcStatBlock({ npc, onEdit }: NpcStatBlockProps) {
  return (
    <div className="max-w-6xl mx-auto bg-paper border border-border shadow-lg bg-cover relative overflow-hidden"
    style={{ backgroundImage: `url(${paperTexture})` }}>
      {/* Inner border effect */}
      <div className="absolute inset-[10px] border border-ink/25 pointer-events-none z-10" />
      {onEdit && (
        <div className="absolute top-4 right-4 z-30">
          <Button onClick={onEdit} variant="small">
            Edit
          </Button>
        </div>
      )}
      <div className="flex flex-col md:flex-row relative z-20">
        {/* Left Column: Text Content (60%) */}
        <div className="md:w-3/5 p-8">
        {/* Name - Massive, Serif, Bold */}
        <h1 className="text-5xl font-serif font-bold text-gray-900 mb-2 leading-tight">
          {npc.name || 'Unnamed Creature'}
        </h1>

        {/* Type/Race - Italic, Large */}
        <p className="text-xl italic text-gray-700 mb-6">
          {npc.type || 'Humanoïde (Humain), Neutre Mauvais'}
        </p>

        {/* Description */}
        {npc.description && (
          <p className="text-lg text-gray-800 mb-8 leading-relaxed">
            {npc.description}
          </p>
        )}

        {/* Stats Section */}
        <div className="mb-8 space-y-4">
          {/* AC, HP, Speed */}
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-500">Classe d'Armure</span>
            <p className="text-xl font-semibold text-gray-900 mt-1">{npc.ca || '—'}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-500">Points de Vie</span>
            <p className="text-xl font-semibold text-gray-900 mt-1">{npc.pv || '—'}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-500">Vitesse</span>
            <p className="text-xl font-semibold text-gray-900 mt-1">{npc.speed || '—'}</p>
          </div>
        </div>

        {/* Abilities - Horizontal Row */}
        <div className="mb-8">
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-4">Attributs</h2>
          <div className="flex gap-8">
            {ABILITIES_ORDER.map((ability) => {
              const modifier = calculateAbilityModifier(npc.abilities[ability])
              const score = npc.abilities[ability]
              return (
                <div key={ability} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 leading-none">
                    {modifier >= 0 ? `+${modifier}` : `${modifier}`}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mt-2">
                    {ABILITY_LABELS[ability]}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    ({score})
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Skills / Saving Throws / Resistances */}
        {npc.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">
              Compétences / JS / Résistances
            </h2>
            <div className="space-y-2">
              {npc.skills.map((skill, idx) => (
                <p key={idx} className="text-lg text-gray-900">
                  {skill}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Special Abilities */}
        {npc.special.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">
              Aptitudes spéciales / Comportement
            </h2>
            <div className="space-y-4">
              {npc.special.map((ability, idx) => (
                <p key={idx} className="text-lg text-gray-900 leading-relaxed">
                  {ability}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {npc.actions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Actions</h2>
            <div className="space-y-4">
              {npc.actions.map((action, idx) => (
                <p key={idx} className="text-lg text-gray-900 leading-relaxed">
                  {action}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Legendary Actions */}
        {npc.legendary_actions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">
              Actions légendaires
            </h2>
            <div className="space-y-4">
              {npc.legendary_actions.map((action, idx) => (
                <p key={idx} className="text-lg text-gray-900 leading-relaxed">
                  {action}
                </p>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Right Column: Portrait (40%) */}
        <div className="md:w-2/5 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-sm">
            {npc.portrait ? (
              <img
                src={npc.portrait}
                alt={`Portrait of ${npc.name || 'creature'}`}
                className="w-full h-auto rounded-lg shadow-lg object-cover"
              />
            ) : (
              <div className="w-full aspect-[160/220] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-md flex items-center justify-center border border-gray-300">
                <div className="text-center">
                  <svg
                    className="w-20 h-20 text-gray-400 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <p className="text-xs uppercase tracking-wider text-gray-400">Character Portrait</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

