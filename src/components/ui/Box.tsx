import { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'light' | 'transparent'
}

export function Box({
  className,
  variant = 'default',
  children,
  ...props
}: BoxProps) {
  const variantStyles = {
    default: 'border border-[#c9b89c] bg-white/40 px-1.5 py-1',
    light: 'border border-[#c9b89c] bg-white/60 px-1.5 py-1',
    transparent: 'border border-[#c9b89c] bg-white/35 px-1.5 py-1',
  }

  return (
    <div
      className={cn(
        'text-xs min-h-[20px] font-body',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

