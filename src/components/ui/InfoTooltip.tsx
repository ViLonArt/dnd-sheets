import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

export type InfoTooltipProps = {
  /** Trigger element - wrapped for hover/focus */
  children: React.ReactNode
  /** Display title (e.g. feature/feat/species name) */
  title: string
  /** Main description text */
  description?: string
  /** Source line, e.g. "Level 3 Barbarian Feature" */
  source?: string
  /** Mechanics line, e.g. "Action: Bonus Action" or "Uses: 2/Long Rest" */
  mechanics?: string
  /** Optional: render as inline card instead of popover (e.g. in selection lists) */
  variant?: 'tooltip' | 'card'
  /** Max width for tooltip content */
  className?: string
}

export function InfoTooltip({
  children,
  title,
  description,
  source,
  mechanics,
  variant = 'tooltip',
  className,
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom')
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || variant !== 'tooltip') return
    const checkViewport = () => {
      const trigger = triggerRef.current
      const content = contentRef.current
      if (!trigger || !content) return
      const rect = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setPosition(spaceBelow >= 200 || spaceBelow >= spaceAbove ? 'bottom' : 'top')
    }
    checkViewport()
  }, [isOpen, variant])

  const content = (
    <div className="space-y-1.5">
      <div className="font-semibold text-[#5c3b22] text-xs">{title}</div>
      {source && (
        <div className="text-[10px] text-[#7a4b36] italic">{source}</div>
      )}
      {description && (
        <p className="text-[11px] text-[#5c3b22] leading-relaxed">{description}</p>
      )}
      {mechanics && (
        <div className="text-[10px] text-[#7a4b36] border-t border-[#c9b89c]/50 pt-1.5 mt-1.5">
          {mechanics}
        </div>
      )}
    </div>
  )

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded border border-[#c9b89c] bg-white/95 p-3 shadow-sm',
          className
        )}
      >
        {content}
      </div>
    )
  }

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}
      {isOpen && (
        <div
          ref={contentRef}
          role="tooltip"
          className={cn(
            'absolute z-50 min-w-[200px] max-w-[320px] rounded border border-[#c9b89c] bg-white/98 p-3 shadow-lg',
            position === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}
