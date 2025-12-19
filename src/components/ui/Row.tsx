import { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface RowProps extends HTMLAttributes<HTMLDivElement> {
  gap?: 'sm' | 'md' | 'lg'
}

export function Row({
  className,
  gap = 'md',
  children,
  ...props
}: RowProps) {
  const gapStyles = {
    sm: 'gap-1.5',
    md: 'gap-3',
    lg: 'gap-4',
  }

  return (
    <div
      className={cn('flex', gapStyles[gap], className)}
      {...props}
    >
      {children}
    </div>
  )
}

