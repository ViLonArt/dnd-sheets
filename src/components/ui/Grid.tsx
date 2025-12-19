import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg'
}

export function Grid({
  className,
  cols = 3,
  gap = 'md',
  children,
  ...props
}: GridProps) {
  const gapStyles = {
    sm: 'gap-1.5',
    md: 'gap-2.5',
    lg: 'gap-4',
  }

  return (
    <div
      className={cn('grid', gapStyles[gap], className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

