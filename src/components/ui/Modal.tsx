import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import paperTexture from '@/assets/paper-texture.jpg';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Use "split" for level-up wizard: left panel + right detail panel, full height, left-aligned */
  variant?: 'default' | 'split'
}

export function Modal({ isOpen, onClose, title, children, className, variant = 'default', ...props }: ModalProps) {
  if (!isOpen) return null

  const isSplit = variant === 'split'

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex bg-black/50',
        isSplit ? 'items-stretch justify-start' : 'items-center justify-center'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-paper border border-border shadow-2xl rounded-lg p-6 bg-cover',
          isSplit
            ? 'h-[90vh] w-[92vw] max-w-[1400px] ml-4 overflow-hidden flex flex-col'
            : 'max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto',
          className
        )}
        style={{ backgroundImage: `url(${paperTexture})` }}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {title && (
          <div className="mb-4 shrink-0">
            <h2 className="font-display text-ink text-xl uppercase">{title}</h2>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

