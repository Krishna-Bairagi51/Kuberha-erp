"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Info, Lightbulb, X } from "lucide-react"
import { LookCard } from "./look-card"
import type { Look } from "../../types/shop-the-look.types"

interface DraggableLookCardProps {
  look: Look
  onView?: (look: Look) => void
  onEdit?: (look: Look) => void
  onDelete?: (look: Look) => void
  onRestore?: (look: Look) => void
  isDeleted?: boolean
  viewMode: 'grid' | 'list'
  index: number
}

function DraggableLookCard({
  look,
  onView,
  onEdit,
  onDelete,
  onRestore,
  isDeleted,
  viewMode,
  index,
}: DraggableLookCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: String(look.id),
    disabled: isDeleted, // Disable dragging for deleted cards
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Don't apply drag listeners if deleted
  const dragListeners = isDeleted ? {} : listeners
  const dragAttributes = isDeleted ? {} : attributes

  if (viewMode === 'list') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...dragAttributes}
        {...dragListeners}
        className={`flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-white transition-all duration-200 ${
          isDeleted ? '' : 'hover:shadow-md'
        } ${
          isDragging 
            ? 'cursor-grabbing scale-[1.01] shadow-lg z-50 opacity-90' 
            : isDeleted 
              ? 'cursor-default' 
              : 'cursor-grab'
        }`}
      >
        <div className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors py-1 pointer-events-none">
          <GripVertical className="h-4 w-4" />
        </div>
        <LookCard
          look={look}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
          isDeleted={isDeleted}
          viewMode={viewMode}
          index={index}
        />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragAttributes}
      {...dragListeners}
      className={`relative group ${
        isDragging 
          ? 'cursor-grabbing scale-[1.03] z-50' 
          : isDeleted 
            ? 'cursor-default' 
            : 'cursor-grab'
      }`}
    >
      <LookCard
        look={look}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestore={onRestore}
        isDeleted={isDeleted}
        viewMode={viewMode}
        index={index}
        dragHandle={
          <div className="text-gray-400 hover:text-gray-600 transition-colors flex items-center pointer-events-none">
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        }
      />
    </div>
  )
}

interface DraggableLooksProps {
  looks: Look[]
  onReorder: (newOrder: Look[]) => Promise<void>
  onView?: (look: Look) => void
  onEdit?: (look: Look) => void
  onDelete?: (look: Look) => void
  onRestore?: (look: Look) => void
  isDeleted?: boolean
  viewMode: 'grid' | 'list'
  showInfoBanner?: boolean
}

export function DraggableLooks({
  looks,
  onReorder,
  onView,
  onEdit,
  onDelete,
  onRestore,
  isDeleted = false,
  viewMode,
  showInfoBanner = false,
}: DraggableLooksProps) {
  // Optimistic state - update immediately on drag
  const [optimisticLooks, setOptimisticLooks] = useState<Look[]>(looks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)

  // Update optimistic state when looks prop changes (from parent)
  useEffect(() => {
    // Important: don't let incoming query refetches "snap back" the list while we're
    // dragging OR while we're waiting for the reorder mutation to finish.
    if (!isDragging && !isReordering) {
      setOptimisticLooks(looks)
    }
  }, [looks, isDragging, isReordering])

  // Configure sensors for smooth dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setIsDragging(true)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = optimisticLooks.findIndex((look) => String(look.id) === active.id)
      const newIndex = optimisticLooks.findIndex((look) => String(look.id) === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        // Optimistic update - update UI immediately
        const newOrder = arrayMove(optimisticLooks, oldIndex, newIndex)
        setOptimisticLooks(newOrder)

        // Then update server (async)
        try {
          setIsReordering(true)
          await onReorder(newOrder)
        } catch (error) {
          // Revert on error
          setOptimisticLooks(looks)
          console.error('Failed to reorder looks:', error)
        } finally {
          setIsReordering(false)
          setIsDragging(false)
        }
      }
    } else {
      // No change, revert to original
      setOptimisticLooks(looks)
      setIsDragging(false)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setIsDragging(false)
    // Revert to original order
    setOptimisticLooks(looks)
  }

  const strategy = viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy
  const activeLook = activeId ? optimisticLooks.find((look) => String(look.id) === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        {/* Info Banner */}
        {showInfoBanner && !isBannerDismissed && (
          <div className="relative flex items-center rounded-2xl bg-blue-50 p-2 sm:p-3 rounded-l-none">
            {/* Dark blue vertical accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-700 rounded-l-3xl overflow-hidden" />
            
            {/* Content */}
            <div className="flex items-center gap-3 flex-1 pl-2">
              {/* Circular Info Icon */}
              <Info className="h-3.5 w-3.5 text-blue-700" />
              
              {/* Text */}
              <p className="text-sm text-gray-700 flex-1">
                Drag cards to change website order. All looks are live on the website.
              </p>
            </div>
            
            {/* Close Button */}
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center transition-colors rounded-3xl"
              aria-label="Close banner"
            >
              <X className="h-3.5 w-3.5 text-gray-700" />
            </button>
          </div>
        )}

        <SortableContext items={optimisticLooks.map((look) => String(look.id))} strategy={strategy}>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 relative'
                : 'flex flex-col gap-3 relative'
            }
            style={{ overflow: 'hidden' }}
          >
            {optimisticLooks.map((look, index) => (
              <DraggableLookCard
                key={look.id}
                look={look}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onRestore={onRestore}
                isDeleted={isDeleted}
                viewMode={viewMode}
                index={index}
              />
            ))}
          </div>
        </SortableContext>
      </div>
      <DragOverlay
        style={{
          cursor: 'grabbing',
        }}
        dropAnimation={{
          duration: viewMode === 'list' ? 250 : 200,
          easing: 'ease-out',
        }}
      >
        {activeLook ? (
          <div
            className={
              viewMode === 'list'
                ? 'opacity-95 scale-[1.02] shadow-2xl bg-white rounded-lg border-2 border-gray-300'
                : 'opacity-90 rotate-2 scale-[1.03] shadow-2xl'
            }
          >
            <LookCard
              look={activeLook}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
              isDeleted={isDeleted}
              viewMode={viewMode}
              index={optimisticLooks.findIndex((look) => String(look.id) === activeId)}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

