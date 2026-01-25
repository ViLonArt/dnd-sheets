import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui'

export function AuthButton() {
  const { user, loading, signIn, signUp, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    try {
      setError(null)
      await signIn(email, password)
      // Clear form on success
      setEmail('')
      setPassword('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      setError(errorMessage)
      alert(errorMessage) // Show alert as requested
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    try {
      setError(null)
      await signUp(email, password)
      // Clear form on success (user is automatically logged in)
      setEmail('')
      setPassword('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up'
      setError(errorMessage)
      alert(errorMessage) // Show alert as requested
    }
  }

  const handleSignOut = async () => {
    try {
      setError(null)
      await signOut()
      setEmail('')
      setPassword('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out'
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#7a4b36]">Loading...</span>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#7a4b36]">
          Logged in as {user.email}
        </span>
        <Button onClick={handleSignOut} variant="small">
          Sign Out
        </Button>
        {error && (
          <span className="text-xs text-red-500">{error}</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <form
        onSubmit={isSignUp ? handleSignUp : handleSignIn}
        className="flex items-center gap-2"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border border-[#c9b89c] px-2 py-1 text-xs rounded bg-white/40 focus:outline-none focus:border-ink min-w-[140px]"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border border-[#c9b89c] px-2 py-1 text-xs rounded bg-white/40 focus:outline-none focus:border-ink min-w-[120px]"
          required
        />
        <Button type="submit" variant="small" disabled={!email || !password}>
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>
        <Button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setError(null)
          }}
          variant="small"
        >
          {isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
        </Button>
      </form>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  )
}

