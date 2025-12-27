import { supabase } from '@/lib/supabase'
import type { Character } from '@/types/character'
import type { Npc } from '@/types/npc'

/**
 * Sheet type discriminator
 */
export type SheetType = 'character' | 'npc'
export type SheetData = Character | Npc

/**
 * Sheet response from API
 */
export interface SheetResponse {
  id: string
  owner_id: string
  data: SheetData
  created_at: string
  updated_at: string
}

/**
 * Create a new sheet
 * The Supabase client automatically includes the Authorization header if logged in
 */
export async function createSheet(
  data: SheetData
): Promise<SheetResponse> {
  try {
    const { data: result, error } = await supabase.functions.invoke('sheet-api', {
      method: 'POST',
      body: { data },
    })

    if (error) {
      console.error('Error creating sheet:', error)
      throw new Error(error.message || 'Failed to create sheet')
    }

    if (!result || !result.id) {
      console.error('Invalid response from sheet-api:', result)
      throw new Error('Invalid response: missing sheet ID')
    }

    return result as SheetResponse
  } catch (err) {
    console.error('Failed to create sheet:', err)
    throw err instanceof Error ? err : new Error('Failed to create sheet')
  }
}

/**
 * Alias for createSheet (saveSheet)
 */
export const saveSheet = createSheet

/**
 * Get a sheet by ID or slug (public access)
 * Accepts either a UUID or a slug identifier
 * The backend will search both the 'id' and 'slug' columns using an OR filter
 */
export async function getSheet(identifier: string): Promise<SheetResponse> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const { data: sessionData } = await supabase.auth.getSession()
    
    // Use query parameter - backend treats 'id' as a generic lookup that searches both id and slug columns
    const url = new URL(`${supabaseUrl}/functions/v1/sheet-api`)
    url.searchParams.set('id', identifier)
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Supabase client automatically adds Authorization header via fetch interceptor
        // But we need to manually add it for direct fetch calls
        ...(sessionData?.session?.access_token && {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        }),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch sheet' }))
      console.error('Error fetching sheet:', errorData, 'Status:', response.status)
      throw new Error(errorData.error || `Failed to fetch sheet: ${response.statusText}`)
    }

    const result = await response.json()
    return result as SheetResponse
  } catch (err) {
    console.error('Failed to get sheet:', err)
    throw err instanceof Error ? err : new Error('Failed to get sheet')
  }
}

/**
 * Update an existing sheet (requires ownership)
 * The Supabase client automatically includes the Authorization header if logged in
 */
export async function updateSheet(
  id: string,
  data: SheetData
): Promise<SheetResponse> {
  try {
    // For PUT with path parameter, we use fetch since invoke doesn't support path params
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (!sessionData?.session) {
      throw new Error('You must be logged in to update a sheet')
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/sheet-api/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({ data }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update sheet' }))
      console.error('Error updating sheet:', errorData, 'Status:', response.status)
      throw new Error(errorData.error || `Failed to update sheet: ${response.statusText}`)
    }

    const result = await response.json()
    return result as SheetResponse
  } catch (err) {
    console.error('Failed to update sheet:', err)
    throw err instanceof Error ? err : new Error('Failed to update sheet')
  }
}

/**
 * Delete a sheet (requires ownership)
 */
export async function deleteSheet(id: string): Promise<void> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (!sessionData?.session) {
      throw new Error('You must be logged in to delete a sheet')
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/sheet-api/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to delete sheet' }))
      console.error('Error deleting sheet:', errorData, 'Status:', response.status)
      throw new Error(errorData.error || `Failed to delete sheet: ${response.statusText}`)
    }
  } catch (err) {
    console.error('Failed to delete sheet:', err)
    throw err instanceof Error ? err : new Error('Failed to delete sheet')
  }
}

/**
 * Upload an avatar image to Supabase Storage
 * Returns the public URL of the uploaded image
 */
export async function uploadAvatar(
  file: Blob,
  filename: string
): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !sessionData?.session?.user) {
    throw new Error('You must be logged in to upload an avatar')
  }

  const userId = sessionData.session.user.id
  const filePath = `${userId}/${filename}`

  // Upload the file
  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Replace if exists
    })

  if (error) {
    throw new Error(`Failed to upload avatar: ${error.message}`)
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

/**
 * Delete an avatar from Supabase Storage
 */
export async function deleteAvatar(filePath: string): Promise<void> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !sessionData?.session) {
    throw new Error('You must be logged in to delete an avatar')
  }

  const { error } = await supabase.storage
    .from('avatars')
    .remove([filePath])

  if (error) {
    throw new Error(`Failed to delete avatar: ${error.message}`)
  }
}

