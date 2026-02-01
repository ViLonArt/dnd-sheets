import { useState } from 'react'
import type { DragEvent } from 'react'
import { AutoResizeTextarea, Box, Button, FieldLabel, PaperContainer, SectionHeader } from '@/components/ui'
import { useDragPreview, useOutsideClick } from '@/hooks'
import type { InventoryItem, ItemCategory } from '@/types/character'

type InventoryTabProps = {
  inventory: InventoryItem[]
  biography: string
  backstory: string
  onInventoryChange: (inventory: InventoryItem[]) => void
  onBiographyChange: (value: string) => void
  onBackstoryChange: (value: string) => void
}

const inventoryCategories: Array<{ key: ItemCategory; label: string }> = [
  { key: 'weapons', label: 'Équipé / Armes / Armures' },
  { key: 'consumables', label: 'Consommables' },
  { key: 'other', label: 'Autre' },
]

const createInventoryItemId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `inv-${Date.now()}`
}

export function InventoryTab({
  inventory,
  biography,
  backstory,
  onInventoryChange,
  onBiographyChange,
  onBackstoryChange,
}: InventoryTabProps) {
  const [expandedInventoryNotesId, setExpandedInventoryNotesId] = useState<string | null>(null)
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null)
  const [inventoryEditSnapshot, setInventoryEditSnapshot] = useState<{
    id: string
    item: InventoryItem
  } | null>(null)
  const [newInventoryId, setNewInventoryId] = useState<string | null>(null)
  const [openInventoryMenuId, setOpenInventoryMenuId] = useState<string | null>(null)
  const [draggingInventoryId, setDraggingInventoryId] = useState<string | null>(null)
  const [dragOverInventoryId, setDragOverInventoryId] = useState<string | null>(null)
  const [dragOverInventoryEdge, setDragOverInventoryEdge] = useState<'top' | 'bottom' | null>(null)
  const { setDragPreview, clearDragPreview } = useDragPreview()

  const editingInventoryCategory =
    editingInventoryId !== null
      ? inventory.find((item) => item.id === editingInventoryId)?.category
      : null

  useOutsideClick({
    isActive: Boolean(openInventoryMenuId),
    onOutsideClick: () => setOpenInventoryMenuId(null),
    ignoreSelector: '[data-inventory-menu]',
  })

  const addInventoryItem = (category: ItemCategory) => {
    const id = createInventoryItemId()
    onInventoryChange([
      ...inventory,
      { id, name: '', quantity: '', notes: '', category },
    ])
    return id
  }

  const updateInventoryItem = (
    index: number,
    updates: Partial<{ name: string; quantity: string; notes: string; category: ItemCategory }>
  ) => {
    const newItems = [...inventory]
    const current = newItems[index]
    if (!current) return
    newItems[index] = {
      id: current.id,
      name: updates.name ?? current.name,
      quantity: updates.quantity ?? current.quantity,
      notes: updates.notes ?? current.notes,
      category: updates.category ?? current.category,
    }
    onInventoryChange(newItems)
  }

  const removeInventoryItem = (index: number) => {
    const removedId = inventory[index]?.id
    onInventoryChange(inventory.filter((_, i) => i !== index))
    if (removedId && editingInventoryId === removedId) {
      setEditingInventoryId(null)
      setNewInventoryId(null)
      setInventoryEditSnapshot(null)
    }
    if (removedId && openInventoryMenuId === removedId) {
      setOpenInventoryMenuId(null)
    }
  }

  const cancelInventoryEdit = () => {
    if (editingInventoryId === null) return
    if (newInventoryId !== null && newInventoryId === editingInventoryId) {
      onInventoryChange(inventory.filter((item) => item.id !== editingInventoryId))
    } else if (inventoryEditSnapshot && inventoryEditSnapshot.id === editingInventoryId) {
      onInventoryChange(
        inventory.map((item) =>
          item.id === editingInventoryId ? inventoryEditSnapshot.item : item
        )
      )
    }
    setEditingInventoryId(null)
    setNewInventoryId(null)
    setInventoryEditSnapshot(null)
  }

  const resetInventoryDragState = () => {
    setDraggingInventoryId(null)
    setDragOverInventoryId(null)
    setDragOverInventoryEdge(null)
    clearDragPreview()
  }

  const reorderInventoryCategory = (
    category: ItemCategory,
    fromIndex: number,
    targetIndex: number,
    edge: 'top' | 'bottom' | null
  ) => {
    if (fromIndex === targetIndex) return
    const categoryIndices = inventory
      .map((item, idx) => (item.category === category ? idx : -1))
      .filter((idx) => idx >= 0)
    const fromCategoryIndex = categoryIndices.indexOf(fromIndex)
    const toCategoryIndex = categoryIndices.indexOf(targetIndex)
    if (fromCategoryIndex < 0 || toCategoryIndex < 0) return
    const categoryItems = categoryIndices.map((idx) => inventory[idx]!)
    const [moved] = categoryItems.splice(fromCategoryIndex, 1)
    if (!moved) return
    const baseInsertIndex = edge === 'bottom' ? toCategoryIndex + 1 : toCategoryIndex
    const insertIndex =
      fromCategoryIndex < baseInsertIndex
        ? Math.max(0, baseInsertIndex - 1)
        : baseInsertIndex
    categoryItems.splice(insertIndex, 0, moved)
    const next = [...inventory]
    categoryIndices.forEach((idx, i) => {
      next[idx] = categoryItems[i]!
    })
    onInventoryChange(next)
  }

  const handleInventoryDragStart =
    (itemId: string) => (event: DragEvent<HTMLElement>) => {
      if (editingInventoryId !== null) return
      setDraggingInventoryId(itemId)
      setDragOverInventoryId(null)
      setDragOverInventoryEdge(null)
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', itemId)
      const previewTarget = event.currentTarget.closest('[data-drag-preview]') as HTMLElement | null
      setDragPreview(event, previewTarget)
    }

  const handleInventoryDragOver = (itemId: string) => (event: DragEvent<HTMLElement>) => {
    if (draggingInventoryId === null || draggingInventoryId === itemId) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const isTop = event.clientY - rect.top < rect.height / 2
    setDragOverInventoryId(itemId)
    setDragOverInventoryEdge(isTop ? 'top' : 'bottom')
    event.dataTransfer.dropEffect = 'move'
  }

  const handleInventoryDrop = (itemId: string) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    if (draggingInventoryId === null || draggingInventoryId === itemId) {
      resetInventoryDragState()
      return
    }
    const fromIndex = inventory.findIndex((item) => item.id === draggingInventoryId)
    const targetIndex = inventory.findIndex((item) => item.id === itemId)
    if (fromIndex < 0 || targetIndex < 0) {
      resetInventoryDragState()
      return
    }
    const fromItem = inventory[fromIndex]
    const targetItem = inventory[targetIndex]
    if (!fromItem || !targetItem || fromItem.category !== targetItem.category) {
      resetInventoryDragState()
      return
    }
    reorderInventoryCategory(fromItem.category, fromIndex, targetIndex, dragOverInventoryEdge)
    resetInventoryDragState()
  }

  const updateGoldQuantity = (nextQuantity: string) => {
    const goldIndex = inventory.findIndex((item) => item.category === 'currency')
    if (goldIndex >= 0) {
      updateInventoryItem(goldIndex, {
        quantity: nextQuantity,
        name: 'PO',
        category: 'currency',
      })
      return
    }
    onInventoryChange([
      ...inventory,
      {
        id: createInventoryItemId(),
        name: 'PO',
        quantity: nextQuantity,
        notes: '',
        category: 'currency',
      },
    ])
  }

  return (
    <PaperContainer>
      <SectionHeader>Inventaire</SectionHeader>
      <div className="mt-1">
        {(() => {
          const goldIndex = inventory.findIndex((item) => item.category === 'currency')
          const goldItem = goldIndex >= 0 ? inventory[goldIndex] : undefined
          return (
            <div className="flex justify-center mb-2">
              <Box className="relative px-3 py-1 text-center">
                <span className="block text-[9px] uppercase text-[#7a4b36] mb-0.5">
                  PO
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="small"
                    onClick={() => {
                      const current = parseInt(goldItem?.quantity ?? '0') || 0
                      updateGoldQuantity(String(Math.max(0, current - 1)))
                    }}
                  >
                    -
                  </Button>
                  <input
                    type="text"
                    value={goldItem?.quantity ?? ''}
                    onChange={(e) => updateGoldQuantity(e.target.value)}
                    size={Math.max(2, String(goldItem?.quantity ?? '').length)}
                    className="w-auto min-w-[32px] bg-transparent border-none outline-none text-sm text-center font-semibold"
                    placeholder="0"
                  />
                  <Button
                    variant="small"
                    onClick={() => {
                      const current = parseInt(goldItem?.quantity ?? '0') || 0
                      updateGoldQuantity(String(current + 1))
                    }}
                  >
                    +
                  </Button>
                </div>
              </Box>
            </div>
          )
        })()}
        <div className="grid grid-cols-3 gap-2">
          {inventoryCategories.map((section) => (
            <div key={section.key} className="border border-[#c9b89c] bg-white/40 p-2">
              <div className="flex items-center justify-between">
                <FieldLabel>{section.label}</FieldLabel>
              </div>
              <div className="mt-1">
                {inventory.map((item, idx) => {
                  if (item.category !== section.key) return null
                  const isEditingItem = editingInventoryId === item.id
                  return (
                    <div
                      key={item.id}
                      data-drag-preview
                      className={`mb-1 ${
                        dragOverInventoryId === item.id && dragOverInventoryEdge === 'top'
                          ? 'border-t-2 border-t-[#7a4b36]'
                          : dragOverInventoryId === item.id && dragOverInventoryEdge === 'bottom'
                            ? 'border-b-2 border-b-[#7a4b36]'
                            : ''
                      } ${draggingInventoryId === item.id ? 'opacity-60' : ''}`}
                      onDragOver={handleInventoryDragOver(item.id)}
                      onDrop={handleInventoryDrop(item.id)}
                      onDragLeave={() => {
                        if (dragOverInventoryId === item.id) {
                          setDragOverInventoryId(null)
                          setDragOverInventoryEdge(null)
                        }
                      }}
                    >
                      {isEditingItem ? (
                        <>
                          <div className="grid grid-cols-[auto_1.4fr_0.4fr_auto] gap-1 items-center">
                            <span className="text-xs text-[#7a4b36] select-none">⋮⋮</span>
                            <Box>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateInventoryItem(idx, { name: e.target.value })}
                                className="w-full bg-transparent border-none outline-none font-bold leading-tight"
                                placeholder="Objet"
                              />
                            </Box>
                            <Box>
                              <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateInventoryItem(idx, { quantity: e.target.value })
                                }
                                className="w-full bg-transparent border-none outline-none text-xs text-center"
                                placeholder="Qté"
                              />
                            </Box>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="small"
                                onClick={() => {
                                  setEditingInventoryId(null)
                                  setNewInventoryId(null)
                                  setInventoryEditSnapshot(null)
                                }}
                              >
                                OK
                              </Button>
                              <Button variant="small" onClick={cancelInventoryEdit}>
                                Annuler
                              </Button>
                            </div>
                          </div>
                          <Box className="mt-1">
                            <AutoResizeTextarea
                              value={item.notes}
                              onChange={(e) =>
                                updateInventoryItem(idx, { notes: e.target.value })
                              }
                              className="w-full bg-transparent border-none outline-none text-xs"
                              placeholder="Notes"
                            />
                          </Box>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-[auto_1.4fr_0.4fr_auto] gap-1 items-center">
                            <span
                              role="button"
                              aria-label="Réordonner l'objet"
                              draggable={editingInventoryId === null}
                              onDragStart={handleInventoryDragStart(item.id)}
                              onDragEnd={resetInventoryDragState}
                              className="text-xs text-[#7a4b36] cursor-grab select-none"
                            >
                              ⋮⋮
                            </span>
                            <Box>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedInventoryNotesId(
                                    expandedInventoryNotesId === item.id ? null : item.id
                                  )
                                }
                                className="w-full text-left bg-transparent border-none outline-none font-bold leading-tight"
                              >
                                {item.name || 'Objet'}
                              </button>
                            </Box>
                            <div className="flex items-center gap-1 justify-center">
                              <Button
                                variant="small"
                                onClick={() => {
                                  const current = parseInt(item.quantity || '0') || 0
                                  updateInventoryItem(idx, {
                                    quantity: String(Math.max(0, current - 1)),
                                  })
                                }}
                              >
                                -
                              </Button>
                              <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateInventoryItem(idx, { quantity: e.target.value })
                                }
                                className="w-10 bg-transparent border-none outline-none text-xs text-center"
                                placeholder="0"
                              />
                              <Button
                                variant="small"
                                onClick={() => {
                                  const current = parseInt(item.quantity || '0') || 0
                                  updateInventoryItem(idx, { quantity: String(current + 1) })
                                }}
                              >
                                +
                              </Button>
                            </div>
                            <div className="flex items-center justify-end">
                              <div className="relative" data-inventory-menu>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenInventoryMenuId(
                                      openInventoryMenuId === item.id ? null : item.id
                                    )
                                  }
                                  className="text-xs px-1"
                                >
                                  ⋯
                                </button>
                                {openInventoryMenuId === item.id && (
                                  <div className="absolute right-0 mt-1 z-10 bg-white border border-[#c9b89c] rounded shadow-sm text-xs">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (editingInventoryId !== null) return
                                        setInventoryEditSnapshot({ id: item.id, item })
                                        setEditingInventoryId(item.id)
                                        setOpenInventoryMenuId(null)
                                      }}
                                      className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        removeInventoryItem(idx)
                                        setOpenInventoryMenuId(null)
                                      }}
                                      className="block w-full text-left px-2 py-1 hover:bg-[#f6efe4]"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {expandedInventoryNotesId === item.id && (
                            <div className="mt-1 border-l-2 border-[#bda68a] bg-white/30 px-2 py-1">
                              <AutoResizeTextarea
                                value={item.notes}
                                onChange={(e) =>
                                  updateInventoryItem(idx, { notes: e.target.value })
                                }
                                className="w-full bg-transparent border-none outline-none text-xs"
                                placeholder="Notes"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Button
                  variant="small"
                  onClick={() => {
                    const nextId = addInventoryItem(section.key)
                    setEditingInventoryId(nextId)
                    setNewInventoryId(nextId)
                  }}
                  disabled={
                    editingInventoryId !== null &&
                    editingInventoryCategory !== section.key
                  }
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SectionHeader className="mt-2.5">Description & Notes</SectionHeader>
      <div className="mt-1 space-y-2">
        <AutoResizeTextarea
          label="Description du personnage"
          value={biography}
          onChange={(e) => onBiographyChange(e.target.value)}
        />
        <AutoResizeTextarea
          label="Notes"
          value={backstory}
          onChange={(e) => onBackstoryChange(e.target.value)}
        />
      </div>
    </PaperContainer>
  )
}
