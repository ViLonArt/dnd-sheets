import { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface ColProps extends HTMLAttributes<HTMLDivElement> {
  flex?: boolean
}

export function Col({
  className,
  flex = true,
  children,
  ...props
}: ColProps) {
  return (
    <div
      className={cn(flex && 'flex-1', className)}
      {...props}
    >
      {children}
    </div>
  )
}

