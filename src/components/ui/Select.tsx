import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-[10px] uppercase tracking-wider text-[#7a4b36]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'border border-[#c9b89c] px-1.5 py-1',
            'bg-white/40 outline-none focus:border-ink focus:bg-white/60',
            'font-body text-xs min-h-[20px]',
            error && 'border-red-500',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }
)

Select.displayName = 'Select'

