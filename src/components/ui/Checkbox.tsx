import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'w-2.5 h-2.5 cursor-pointer',
            'accent-ink',
            className
          )}
          {...props}
        />
        {label && (
          <span className="text-xs font-body text-ink">{label}</span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

