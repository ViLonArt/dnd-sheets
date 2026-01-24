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
  const path = `users/${userId}/${filename}`

  // Upload the file
  const { data, error } = await supabase.storage
    .from('character-images')
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
    .from('character-images')
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

