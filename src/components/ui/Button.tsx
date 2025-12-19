import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'small'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'border border-[#c0b7aa] bg-[#fff7ec] text-ink font-semibold rounded',
          'hover:bg-[#f3e2c8] transition-colors cursor-pointer',
          variant === 'default' ? 'px-2.5 py-1.5 text-[13px]' : 'px-1.5 py-1 text-xs',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

