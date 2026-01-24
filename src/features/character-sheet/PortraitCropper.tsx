import { ImageCropperModal } from '@/components/ImageCropperModal'

type PortraitCropperProps = {
  isOpen: boolean
  imageSrc: string | null
  onClose: () => void
  onSave: (croppedImageUrl: string) => void
  aspectRatio: number
}

export function PortraitCropper({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  aspectRatio,
}: PortraitCropperProps) {
  return (
    <ImageCropperModal
      isOpen={isOpen}
      imageSrc={imageSrc}
      onClose={onClose}
      onSave={onSave}
      aspectRatio={aspectRatio}
    />
  )
}
