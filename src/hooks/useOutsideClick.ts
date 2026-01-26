import { useEffect, useRef } from 'react'

type UseOutsideClickOptions = {
  isActive: boolean
  onOutsideClick: () => void
  ignoreSelector?: string
}

export function useOutsideClick({ isActive, onOutsideClick, ignoreSelector }: UseOutsideClickOptions) {
  const handlerRef = useRef(onOutsideClick)

  useEffect(() => {
    handlerRef.current = onOutsideClick
  }, [onOutsideClick])

  useEffect(() => {
    if (!isActive) return
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (ignoreSelector && target.closest(ignoreSelector)) return
      handlerRef.current()
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [isActive, ignoreSelector])
}
