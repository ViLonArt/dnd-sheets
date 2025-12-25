import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import CharacterSheetPage from './pages/CharacterSheetPage'
import NpcSheetPage from './pages/NpcSheetPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/character" element={<CharacterSheetPage />} />
        <Route path="/character/:id" element={<CharacterSheetPage />} />
        <Route path="/npc" element={<NpcSheetPage />} />
        <Route path="/npc/:id" element={<NpcSheetPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

