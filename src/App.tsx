import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CharacterSheetPage from './pages/CharacterSheetPage'
import NpcSheetPage from './pages/NpcSheetPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/character" element={<CharacterSheetPage />} />
      <Route path="/npc" element={<NpcSheetPage />} />
    </Routes>
  )
}

export default App

