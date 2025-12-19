/**
 * Utility functions for image cropping using Canvas API
 * Used with react-easy-crop
 */

interface Crop {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Creates an image element from a source URL
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })
}

/**
 * Gets the cropped image as a blob URL
 * @param imageSrc - Source URL of the image
 * @param pixelCrop - Crop area in pixels
 * @returns Promise resolving to a blob URL of the cropped image
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Crop
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Set canvas size to match crop area
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped portion of the image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Convert canvas to blob URL
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        const url = URL.createObjectURL(blob)
        resolve(url)
      },
      'image/png',
      1.0 // Quality (1.0 = highest)
    )
  })
}

/**
 * Gets the cropped image as a base64 data URL
 * @param imageSrc - Source URL of the image
 * @param pixelCrop - Crop area in pixels
 * @returns Promise resolving to a base64 data URL of the cropped image
 */
export async function getCroppedImgAsBase64(
  imageSrc: string,
  pixelCrop: Crop
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Set canvas size to match crop area
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped portion of the image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Convert canvas to base64
  return canvas.toDataURL('image/png', 1.0)
}

