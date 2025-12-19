import { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface PropertyLineProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value?: string
  editable?: boolean
  onValueChange?: (value: string) => void
}

export function PropertyLine({
  className,
  label,
  value = '',
  editable = false,
  onValueChange,
  ...props
}: PropertyLineProps) {
  return (
    <div className={cn('mb-1.5', className)} {...props}>
      <h4 className="inline text-ink font-semibold">{label}</h4>{' '}
      {editable ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          className="inline bg-transparent border-none outline-none focus:underline font-body"
          style={{ minWidth: '100px' }}
        />
      ) : (
        <p className="inline font-body">{value}</p>
      )}
    </div>
  )
}

