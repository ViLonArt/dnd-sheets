import { useMemo, useState } from 'react'
import { cn } from '@/utils/cn'

export type FilterOption<T> = {
  id: string
  label: string
  value: T
}

export type FilterConfig<T> = {
  key: string
  label: string
  options: FilterOption<T>[]
  getItemValue: (item: FilterableListItem) => T
}

export type FilterableListItem = {
  id: string
  label: string
  description?: string
  /** Optional: for secondary filter (e.g. weapon.mastery) */
  meta?: Record<string, unknown>
}

export type FilterableListProps = {
  items: FilterableListItem[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  maxSelections: number
  /** Optional filters (Level, School, Action Type, etc.) */
  filters?: FilterConfig<unknown>[]
  /** Label for the selection count, e.g. "Select 2/2" */
  selectionLabel?: string
  /** Optional: render custom item (for tooltips) */
  renderItem?: (item: FilterableListItem, isSelected: boolean) => React.ReactNode
  className?: string
}

export function FilterableList({
  items,
  selectedIds,
  onSelectionChange,
  maxSelections,
  filters = [],
  selectionLabel,
  renderItem,
  className,
}: FilterableListProps) {
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>(() =>
    filters.reduce((acc, f) => ({ ...acc, [f.key]: null }), {})
  )

  const filteredItems = useMemo(() => {
    let result = items
    for (const filter of filters) {
      const value = filterValues[filter.key]
      if (value == null || value === '') continue
      result = result.filter((item) => filter.getItemValue(item) === value)
    }
    return result
  }, [items, filters, filterValues])

  const canSelect = selectedIds.length < maxSelections

  const toggleItem = (id: string) => {
    const idx = selectedIds.indexOf(id)
    let next: string[]
    if (idx >= 0) {
      next = selectedIds.filter((_, i) => i !== idx)
    } else if (canSelect) {
      next = [...selectedIds, id]
    } else {
      next = selectedIds
    }
    onSelectionChange(next)
  }

  const countText =
    selectionLabel ??
    `Select ${selectedIds.length}/${maxSelections}`

  const isValid = selectedIds.length === maxSelections

  return (
    <div className={cn('grid gap-2', className)}>
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <select
              key={filter.key}
              value={String(filterValues[filter.key] ?? '')}
              onChange={(e) => {
                const raw = e.target.value
                const opt = filter.options.find((o) => String(o.value) === raw)
                setFilterValues((prev) => ({
                  ...prev,
                  [filter.key]: opt?.value ?? null,
                }))
              }}
              className="text-xs border border-[#c9b89c] rounded px-2 py-1 bg-white/80"
            >
              <option value="">{filter.label} (all)</option>
              {filter.options.map((opt) => (
                <option key={opt.id} value={String(opt.value)}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1 rounded text-xs',
          isValid ? 'bg-green-50/80' : 'bg-amber-50/80'
        )}
      >
        <span className={cn('font-medium', isValid ? 'text-green-700' : 'text-amber-700')}>
          {countText}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto">
        {filteredItems.map((item) => {
          const isSelected = selectedIds.includes(item.id)
          const canClick = isSelected || canSelect

          return (
            <button
              key={item.id}
              type="button"
              disabled={!canClick}
              onClick={() => toggleItem(item.id)}
              className={cn(
                'px-2 py-1.5 rounded text-xs border transition-colors',
                isSelected
                  ? 'border-[#7a4b36] bg-[#f3e2c8]'
                  : canSelect
                    ? 'border-[#c9b89c] bg-white/60 hover:bg-white/80'
                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              )}
            >
              {renderItem ? renderItem(item, isSelected) : item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
