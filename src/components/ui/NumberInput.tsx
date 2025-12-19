import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface NumberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
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
          type="number"
          className={cn(
            'border border-[#c9b89c] px-1.5 py-1',
            'bg-white/40 outline-none focus:border-ink focus:bg-white/60',
            'font-body text-xs min-h-[20px]',
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

NumberInput.displayName = 'NumberInput'

