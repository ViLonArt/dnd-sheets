import { useCallback, useEffect, useRef } from 'react'
import type { DragEvent } from 'react'

type DragPreviewHelpers = {
  setDragPreview: (event: DragEvent<HTMLElement>, element: HTMLElement | null) => void
  clearDragPreview: () => void
}

export function useDragPreview(): DragPreviewHelpers {
  const previewRef = useRef<HTMLElement | null>(null)

  const clearDragPreview = useCallback(() => {
    const preview = previewRef.current
    if (preview?.parentNode) {
      preview.parentNode.removeChild(preview)
    }
    previewRef.current = null
  }, [])

  const setDragPreview = useCallback(
    (event: DragEvent<HTMLElement>, element: HTMLElement | null) => {
      if (!element || !event.dataTransfer || typeof document === 'undefined') return

      clearDragPreview()

      const rect = element.getBoundingClientRect()
      const clone = element.cloneNode(true) as HTMLElement
      clone.style.position = 'absolute'
      clone.style.top = '-9999px'
      clone.style.left = '-9999px'
      clone.style.width = `${rect.width}px`
      clone.style.height = `${rect.height}px`
      clone.style.pointerEvents = 'none'
      clone.style.opacity = '0.85'
      clone.style.margin = '0'
      clone.style.boxSizing = 'border-box'
      clone.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)'

      document.body.appendChild(clone)
      previewRef.current = clone

      const offsetX = Number.isFinite(event.clientX) ? event.clientX - rect.left : rect.width / 2
      const offsetY = Number.isFinite(event.clientY) ? event.clientY - rect.top : rect.height / 2
      event.dataTransfer.setDragImage(
        clone,
        Math.max(0, Math.min(offsetX, rect.width)),
        Math.max(0, Math.min(offsetY, rect.height))
      )
    },
    [clearDragPreview]
  )

  useEffect(() => () => clearDragPreview(), [clearDragPreview])

  return { setDragPreview, clearDragPreview }
}
