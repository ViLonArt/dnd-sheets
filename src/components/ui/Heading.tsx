import { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'lg' | 'md' | 'sm'
}

export function Heading({
  className,
  as: Component = 'h1',
  size = 'lg',
  children,
  ...props
}: HeadingProps) {
  const sizeStyles = {
    lg: 'text-[26px] mb-2',
    md: 'text-xl mb-1',
    sm: 'text-lg mb-1',
  }

  return (
    <Component
      className={cn(
        'font-display text-ink uppercase',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

