import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-[10px] uppercase tracking-wider text-[#7a4b36]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="text"
          className={cn(
            'border-b border-[#bda68a] min-h-[18px] px-0.5 pb-0.5',
            'bg-transparent outline-none focus:border-ink',
            'font-body text-sm',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }
)

TextInput.displayName = 'TextInput'

