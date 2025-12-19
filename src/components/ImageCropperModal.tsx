import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { Modal, Button } from '@/components/ui'
import { getCroppedImgAsBase64 } from '@/utils/canvasUtils'

export interface ImageCropperModalProps {
  isOpen: boolean
  imageSrc: string | null
  onClose: () => void
  onSave: (croppedImageUrl: string) => void
  aspectRatio?: number
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  aspectRatio = 1, // Default to square (1:1)
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const croppedImageUrl = await getCroppedImgAsBase64(imageSrc, {
        x: croppedAreaPixels.x,
        y: croppedAreaPixels.y,
        width: croppedAreaPixels.width,
        height: croppedAreaPixels.height,
      })
      onSave(croppedImageUrl)
      onClose()
    } catch (error) {
      console.error('Error cropping image:', error)
      alert('Failed to crop image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!imageSrc) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crop Portrait">
      <div className="flex flex-col gap-4">
        {/* Cropper Container */}
        <div className="relative w-full h-[400px] bg-gray-800 rounded overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="rect"
            showGrid={true}
            restrictPosition={true}
          />
        </div>

        {/* Zoom Slider */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-ink">
            Zoom: {zoom.toFixed(2)}x
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Instructions */}
        <p className="text-xs text-[#7a4b36] italic">
          Drag the image to position it, then adjust the zoom slider. Click Save when done.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button onClick={onClose} variant="small" disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="small" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

