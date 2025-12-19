import { LabelHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface FieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export function FieldLabel({ className, children, ...props }: FieldLabelProps) {
  return (
    <label
      className={cn(
        'text-[10px] uppercase tracking-wider text-[#7a4b36]',
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
}

