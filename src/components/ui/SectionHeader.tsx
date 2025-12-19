import { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface SectionHeaderProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function SectionHeader({
  className,
  as: Component = 'h3',
  children,
  ...props
}: SectionHeaderProps) {
  return (
    <Component
      className={cn(
        'font-display text-ink',
        'border-b-2 border-ink inline-block',
        'mt-2.5 mb-1 pb-0.5',
        'text-base',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

