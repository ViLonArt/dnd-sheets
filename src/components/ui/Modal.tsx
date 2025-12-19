import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children, className, ...props }: ModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-paper border border-border shadow-2xl rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto',
          'bg-[url("https://upload.wikimedia.org/wikipedia/commons/5/5f/Old_paper_texture_27.jpg")] bg-cover',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {title && (
          <div className="mb-4">
            <h2 className="font-display text-ink text-xl uppercase">{title}</h2>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

