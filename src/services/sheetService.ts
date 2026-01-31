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

export interface SheetListItem {
  id: string
  slug: string | null
  name: string
  portrait: string | null
  updatedAt: string
}

export interface CharacterSheetResponse {
  id: string
  owner_id: string
  data: Character
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

const normalizeSheetData = (data: unknown): Record<string, unknown> | null => {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as unknown
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>
      }
    } catch {
      return null
    }
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (record.data && typeof record.data === 'object') {
      return record.data as Record<string, unknown>
    }
    return record
  }

  return null
}

const getSheetName = (data: unknown): string => {
  const normalized = normalizeSheetData(data)
  const name = normalized?.name
  if (typeof name === 'string' && name.trim()) {
    return name.trim()
  }
  return 'Sans nom'
}

const getSheetPortrait = (data: unknown): string | null => {
  const normalized = normalizeSheetData(data)
  const portrait = normalized?.portrait ?? normalized?.portraitUrl ?? normalized?.image
  if (typeof portrait === 'string' && portrait.trim()) {
    return portrait.trim()
  }
  if (portrait && typeof portrait === 'object') {
    const portraitRecord = portrait as Record<string, unknown>
    const url = portraitRecord.url ?? portraitRecord.src
    if (typeof url === 'string' && url.trim()) {
      return url.trim()
    }
  }
  return null
}

export async function listNpcSheets(): Promise<SheetListItem[]> {
  const { data, error } = await supabase
    .from('sheets')
    .select('id, slug, data, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error listing NPC sheets:', error)
    throw new Error(error.message || 'Failed to load NPC sheets')
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug ?? null,
    name: getSheetName(row.data),
    portrait: getSheetPortrait(row.data),
    updatedAt: row.updated_at,
  }))
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
 * Create a new character sheet
 */
export async function createCharacterSheet(
  data: Character
): Promise<CharacterSheetResponse> {
  try {
    const { data: result, error } = await supabase.functions.invoke('character-sheet-api', {
      method: 'POST',
      body: { data },
    })

    if (error) {
      console.error('Error creating character sheet:', error)
      throw new Error(error.message || 'Failed to create character sheet')
    }

    if (!result || !result.id) {
      console.error('Invalid response from character-sheet-api:', result)
      throw new Error('Invalid response: missing sheet ID')
    }

    return result as CharacterSheetResponse
  } catch (err) {
    console.error('Failed to create character sheet:', err)
    throw err instanceof Error ? err : new Error('Failed to create character sheet')
  }
}

/**
 * Get a character sheet by ID or slug (public access)
 */
export async function getCharacterSheet(
  identifier: string
): Promise<CharacterSheetResponse> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const { data: sessionData } = await supabase.auth.getSession()

    const url = new URL(`${supabaseUrl}/functions/v1/character-sheet-api`)
    url.searchParams.set('id', identifier)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionData?.session?.access_token && {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        }),
      },
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Failed to fetch character sheet' }))
      console.error('Error fetching character sheet:', errorData, 'Status:', response.status)
      throw new Error(errorData.error || `Failed to fetch character sheet: ${response.statusText}`)
    }

    const result = await response.json()
    return result as CharacterSheetResponse
  } catch (err) {
    console.error('Failed to get character sheet:', err)
    throw err instanceof Error ? err : new Error('Failed to get character sheet')
  }
}

export async function listCharacterSheets(): Promise<SheetListItem[]> {
  const { data, error } = await supabase
    .from('character_sheets')
    .select('id, slug, data, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error listing character sheets:', error)
    throw new Error(error.message || 'Failed to load character sheets')
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug ?? null,
    name: getSheetName(row.data),
    portrait: getSheetPortrait(row.data),
    updatedAt: row.updated_at,
  }))
}

/**
 * Update an existing character sheet (requires ownership)
 */
export async function updateCharacterSheet(
  id: string,
  data: Character
): Promise<CharacterSheetResponse> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData?.session) {
      throw new Error('You must be logged in to update a character sheet')
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/character-sheet-api/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({ data }),
    })

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Failed to update character sheet' }))
      console.error('Error updating character sheet:', errorData, 'Status:', response.status)
      throw new Error(errorData.error || `Failed to update character sheet: ${response.statusText}`)
    }

    const result = await response.json()
    return result as CharacterSheetResponse
  } catch (err) {
    console.error('Failed to update character sheet:', err)
    throw err instanceof Error ? err : new Error('Failed to update character sheet')
  }
}

/**
 * Upload an image to Supabase Storage
 * Returns the public URL of the uploaded image
 * @param file - The image file to upload
 * @param slug - Optional slug to include in the filename (for sheet images)
 */
export async function uploadImage(file: File, slug?: string): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !sessionData?.session?.user) {
    throw new Error('You must be logged in to upload images')
  }

  const userId = sessionData.session.user.id
  const timestamp = Date.now()
  const extension = file.name.split('.').pop() || 'png'
  const filename = slug 
    ? `${slug}-${timestamp}.${extension}`
    : `${timestamp}.${extension}`
  const path = `${userId}/${filename}`

  // Upload the file
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Replace if exists
    })

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  if (!data) {
    throw new Error('Upload succeeded but no data returned')
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

/**
 * Convert a data URL to a File object
 * Useful for uploading cropped images from canvas
 */
export function dataURLtoFile(dataurl: string, filename: string): File {
  const [header, body] = dataurl.split(',')
  if (!header || !body) {
    throw new Error('Invalid data URL')
  }
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(body)
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
}

