import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

/**
 * Auth callback page to handle OAuth and Magic Link redirects
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth error:', error)
          navigate('/?error=auth_failed')
          return
        }

        if (data.session) {
          // Successfully authenticated, redirect to home
          navigate('/')
        } else {
          // No session, redirect to home
          navigate('/')
        }
      } catch (err) {
        console.error('Error handling auth callback:', err)
        navigate('/?error=auth_failed')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-[#7a4b36]">Completing sign in...</p>
      </div>
    </div>
  )
}

