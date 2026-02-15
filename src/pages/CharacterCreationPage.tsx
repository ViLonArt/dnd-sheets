import { useNavigate } from 'react-router-dom'
import type { Character } from '@/types/character'
import { CharacterCreationWizard } from '@/features/character-sheet/CharacterCreationWizard'

const UI_LOCALE = 'fr' as const

export default function CharacterCreationPage() {
  const navigate = useNavigate()

  const handleComplete = (character: Character) => {
    navigate('/character', { state: { character } })
  }

  const handleClose = () => {
    navigate('/character')
  }

  return (
    <CharacterCreationWizard
      locale={UI_LOCALE}
      onComplete={handleComplete}
      onClose={handleClose}
      asPage
    />
  )
}
