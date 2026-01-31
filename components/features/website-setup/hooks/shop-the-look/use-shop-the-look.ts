"use client"

import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  getActiveLooks, 
  getDeletedLooks, 
  deleteLook, 
  restoreLook 
} from '../../services/shop-the-look.service'
import { useActiveLooksQuery, useUpdateLookOrderMutation } from './use-shop-the-look-query'
import type {
  Look,
  ViewMode,
  TabType,
  UseShopTheLookOptions,
  UseShopTheLookReturn,
} from '../../types/shop-the-look.types'

// ============================================================================
// useShopTheLook Hook
// ============================================================================

/**
 * Custom hook for shop the look functionality
 * Manages active/deleted looks, search, filtering, and drag-and-drop reordering
 * Uses TanStack Query for data fetching
 * 
 * @example
 * ```tsx
 * const { activeLooks, searchTerm, setSearchTerm, handleReorder } = useShopTheLook()
 * ```
 */
export function useShopTheLook(options: UseShopTheLookOptions = {}): UseShopTheLookReturn {
  const { autoFetch = true } = options

  // Fetch active looks using TanStack Query
  const { 
    data: activeResponse, 
    isLoading: isLoadingActive, 
    error: activeError,
    refetch: refetchActive
  } = useActiveLooksQuery()

  // Mutation for updating look order with optimistic updates
  const updateOrderMutation = useUpdateLookOrderMutation()

  // Fetch deleted looks (currently empty from API)
  const { 
    data: deletedResponse, 
    isLoading: isLoadingDeleted 
  } = useQuery({
    queryKey: ['shopTheLook', 'deleted'],
    queryFn: () => getDeletedLooks(),
    enabled: autoFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  // UI State
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [activeTab, setActiveTab] = useState<TabType>('active')

  // Extract data from responses
  const activeLooks = activeResponse?.looks || []
  const deletedLooks = deletedResponse?.looks || []
  const isLoading = isLoadingActive || isLoadingDeleted
  const error = activeError ? (activeError instanceof Error ? activeError.message : 'Failed to fetch looks') : null

  // Filter looks based on search term
  const filteredActiveLooks = useMemo(() => {
    if (!searchTerm.trim()) return activeLooks
    const term = searchTerm.toLowerCase()
    return activeLooks.filter(look => 
      look.name.toLowerCase().includes(term)
    )
  }, [activeLooks, searchTerm])

  const filteredDeletedLooks = useMemo(() => {
    if (!searchTerm.trim()) return deletedLooks
    const term = searchTerm.toLowerCase()
    return deletedLooks.filter(look => 
      look.name.toLowerCase().includes(term)
    )
  }, [deletedLooks, searchTerm])

  // Handle reorder with optimistic updates
  const handleReorder = useCallback(async (newOrder: Look[]) => {
    try {
      // API expects `{ id, sequence }` per record
      const payload = newOrder.map((look, index) => ({
        id: look.id,
        sequence: index + 1,
      }))
      // Mutation handles optimistic updates automatically
      await updateOrderMutation.mutateAsync(payload)
    } catch (err) {
      console.error('Failed to reorder looks:', err)
      throw err
    }
  }, [updateOrderMutation])

  // Handle delete
  const handleDelete = useCallback(async (lookId: number | string) => {
    try {
      const response = await deleteLook(lookId)
      if (response.status_code === 200) {
        // Invalidate and refetch
        await refetchActive()
        return true
      }
      if (response.errors?.length) {
        console.error('Delete look failed:', response.errors)
      }
      return false
    } catch (err) {
      console.error('Failed to delete look:', err)
      return false
    }
  }, [refetchActive])

  // Handle restore
  const handleRestore = useCallback(async (lookId: number | string) => {
    try {
      const response = await restoreLook(lookId)
      if (response.status_code === 200) {
        // Invalidate and refetch
        await refetchActive()
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to restore look:', err)
      return false
    }
  }, [refetchActive])

  // Refetch all data
  const refetch = useCallback(() => {
    refetchActive()
  }, [refetchActive])

  return {
    // Data
    activeLooks: filteredActiveLooks,
    deletedLooks: filteredDeletedLooks,
    isLoading,
    error,
    
    // UI State
    searchTerm,
    viewMode,
    activeTab,
    
    // Actions
    setSearchTerm,
    setViewMode,
    setActiveTab,
    handleReorder,
    handleDelete,
    handleRestore,
    refetch,
  }
}
