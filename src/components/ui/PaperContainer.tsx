import { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
import paperTexture from '@/assets/paper-texture.jpg';

export interface PaperContainerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'spell-block'
}

export function PaperContainer({
  className,
  variant = 'default',
  children,
  ...props
}: PaperContainerProps) {
  return (
    <div
      className={cn(
        'bg-paper border border-border shadow-lg',
        'bg-cover p-5 mx-auto relative',
        variant === 'spell-block' && 'mt-1.5',
        className
      )}
      style={{ backgroundImage: `url(${paperTexture})` }}
      {...props}
    >
      {/* Inner border effect */}
      <div className="absolute inset-[10px] border border-ink/25 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

