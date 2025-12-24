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
 */
export async function createSheet(
  data: SheetData
): Promise<SheetResponse> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !sessionData?.session) {
    throw new Error('You must be logged in to create a sheet')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  
  const response = await fetch(`${supabaseUrl}/functions/v1/sheet-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
    body: JSON.stringify({ data }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create sheet' }))
    throw new Error(error.error || `Failed to create sheet: ${response.statusText}`)
  }

  return response.json() as Promise<SheetResponse>
}

/**
 * Get a sheet by ID (public access)
 */
export async function getSheet(id: string): Promise<SheetResponse> {
  // For GET requests, we need to pass the ID in the URL path
  // Supabase functions.invoke doesn't support path parameters directly,
  // so we'll use a direct fetch instead
  const { data: sessionData } = await supabase.auth.getSession()
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  
  const response = await fetch(`${supabaseUrl}/functions/v1/sheet-api/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(sessionData?.session?.access_token && {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      }),
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch sheet' }))
    throw new Error(error.error || `Failed to fetch sheet: ${response.statusText}`)
  }

  return response.json() as Promise<SheetResponse>
}

/**
 * Update an existing sheet (requires ownership)
 */
export async function updateSheet(
  id: string,
  data: SheetData
): Promise<SheetResponse> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !sessionData?.session) {
    throw new Error('You must be logged in to update a sheet')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  
  const response = await fetch(`${supabaseUrl}/functions/v1/sheet-api/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
    body: JSON.stringify({ data }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update sheet' }))
    throw new Error(error.error || `Failed to update sheet: ${response.statusText}`)
  }

  return response.json() as Promise<SheetResponse>
}

/**
 * Delete a sheet (requires ownership)
 */
export async function deleteSheet(id: string): Promise<void> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !sessionData?.session) {
    throw new Error('You must be logged in to delete a sheet')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  
  const response = await fetch(`${supabaseUrl}/functions/v1/sheet-api/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete sheet' }))
    throw new Error(error.error || `Failed to delete sheet: ${response.statusText}`)
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

