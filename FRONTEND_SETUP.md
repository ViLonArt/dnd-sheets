# Frontend Setup Guide

## Step 1: Install Dependencies

The Supabase client library should already be installed. If not:

```bash
npm install @supabase/supabase-js
```

## Step 2: Configure Environment Variables

1. Create a `.env` file in the root of your project (copy from `.env.example`):

```bash
cp .env.example .env
```

2. Get your Supabase credentials:
   - Go to your Supabase Dashboard
   - Navigate to **Settings** → **API**
   - Copy the **Project URL** → Set as `VITE_SUPABASE_URL`
   - Copy the **anon public** key → Set as `VITE_SUPABASE_ANON_KEY`

3. Update your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** The `.env` file is already in `.gitignore`, so your keys won't be committed.

## Step 3: Verify Setup

The following files have been created:

- ✅ `src/lib/supabase.ts` - Supabase client initialization
- ✅ `src/services/sheetService.ts` - Service layer for API calls

## Step 4: Next Steps

### A. Add Authentication UI

You'll need to add login/signup buttons to your app. Here's a simple example:

```tsx
// src/components/AuthButton.tsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui'

export function AuthButton() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github', // or 'google', 'discord', etc.
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) console.error('Error signing in:', error)
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error signing out:', error)
  }

  if (loading) return <div>Loading...</div>

  return user ? (
    <div className="flex items-center gap-2">
      <span className="text-sm">Logged in as {user.email}</span>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>
  ) : (
    <Button onClick={handleSignIn}>Sign In</Button>
  )
}
```

### B. Update Hooks to Use Supabase

You'll need to update `useCharacterForm` and `useNpcForm` hooks to:
- Load sheets from Supabase instead of localStorage
- Save to Supabase instead of localStorage
- Handle sheet IDs for sharing

### C. Add Routing for Shared Sheets

Add routes like:
- `/character/:id` - View/edit character sheet
- `/npc/:id` - View/edit NPC sheet

## Testing

1. Start your dev server: `npm run dev`
2. Check the browser console for any Supabase connection errors
3. Try signing in with your Supabase account

## Troubleshooting

### "Supabase URL and/or Anon Key are missing"

- Make sure your `.env` file exists and has the correct variables
- Restart your dev server after creating/updating `.env`
- Check that variable names start with `VITE_` (required for Vite)

### "Failed to create sheet: Unauthorized"

- Make sure you're signed in
- Check that the Edge Function is deployed
- Verify environment variables are set in Supabase Dashboard

### CORS Errors

- The Edge Function already includes CORS headers
- If you still see CORS errors, check that your Supabase URL is correct

