import { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  variant?: 'default' | 'tapered'
}

export function Divider({
  className,
  variant = 'default',
  ...props
}: DividerProps) {
  if (variant === 'tapered') {
    return (
      <hr
        className={cn(
          'block w-full h-[5px] border-none',
          'bg-ink text-ink',
          'clip-path-[polygon(0_0,100%_0,95%_100%,5%_100%)]',
          'my-3',
          className
        )}
        style={{
          clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
        }}
        {...props}
      />
    )
  }

  return (
    <hr
      className={cn('border-t border-ink/30 my-3', className)}
      {...props}
    />
  )
}

