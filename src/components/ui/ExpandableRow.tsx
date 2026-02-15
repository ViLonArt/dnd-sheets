import { cn } from '@/utils/cn'

export type MechanicsTag = {
  label: string
  value: string
}

export type ExpandableRowProps = {
  id: string
  label: string
  isSelected: boolean
  isExpanded: boolean
  onToggle: () => void
  /** Full localized description from rules2024 i18n */
  description?: string
  /** Source line, e.g. "Level 1 Barbarian" */
  source?: string
  /** Tagged metadata: Action Type, Reset Condition, Hit Die, etc. */
  mechanicsTags?: MechanicsTag[]
  children?: React.ReactNode
  className?: string
}

export function ExpandableRow({
  id,
  label,
  isSelected,
  isExpanded,
  onToggle,
  description,
  source,
  mechanicsTags = [],
  children,
  className,
}: ExpandableRowProps) {
  return (
    <div
      data-expandable-id={id}
      className={cn(
        'rounded border overflow-hidden',
        isSelected ? 'border-[#7a4b36]' : 'border-[#c9b89c]',
        className
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 min-h-[44px] text-left text-xs transition-colors',
          isSelected ? 'bg-[#f3e2c8]' : 'bg-white/70 hover:bg-white/90'
        )}
      >
        <span className="min-w-0 flex-1 truncate font-medium text-[#5c3b22]" title={label}>{label}</span>
        <span
          className={cn(
            'text-[#7a4b36] transition-transform duration-150',
            isExpanded && 'rotate-180'
          )}
        >
          ▾
        </span>
      </button>

      {isExpanded && (
        <div className="bg-[#2d1f17] text-[#f5ebe0] px-3 py-3 border-t border-[#7a4b36]/30">
          {source && (
            <div className="text-[10px] uppercase tracking-wider text-[#c9a86c] mb-2">
              {source}
            </div>
          )}
          {description && (
            <p className="text-[12px] leading-relaxed mb-3">{description}</p>
          )}
          {mechanicsTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {mechanicsTags.map((tag) => (
                <span
                  key={tag.label}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#5c3b22]/80 text-[10px]"
                >
                  <span className="text-[#c9a86c]">{tag.label}:</span>
                  <span>{tag.value}</span>
                </span>
              ))}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  )
}
