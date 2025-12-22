import { TextareaHTMLAttributes, useLayoutEffect, useRef } from 'react'
import { cn } from '@/utils/cn'

export interface AutoResizeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function AutoResizeTextarea({
  className,
  label,
  error,
  value,
  onChange,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize on value change (including initial mount and import)
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    // This ensures we get the accurate height even with newlines from imported data
    textarea.style.height = 'auto'
    // Set height to scrollHeight to fit content
    // scrollHeight accounts for all content including newlines (\n)
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[10px] uppercase tracking-wider text-[#7a4b36]">
          {label}
        </label>
      )}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={onChange}
        className={cn(
          'border-b border-[#bda68a] min-h-[18px] px-0.5 pb-0.5',
          'bg-transparent outline-none focus:border-ink',
          'font-body text-sm resize-none overflow-hidden',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

