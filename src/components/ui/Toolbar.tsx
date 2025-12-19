import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  left?: ReactNode
  right?: ReactNode
}

export function Toolbar({
  className,
  left,
  right,
  children,
  ...props
}: ToolbarProps) {
  return (
    <div
      className={cn(
        'flex justify-between items-center gap-2',
        'mb-3 flex-wrap',
        className
      )}
      {...props}
    >
      {left && <div className="flex gap-2 items-center">{left}</div>}
      {children && <div className="flex gap-2 items-center">{children}</div>}
      {right && <div className="flex gap-2 items-center">{right}</div>}
    </div>
  )
}

