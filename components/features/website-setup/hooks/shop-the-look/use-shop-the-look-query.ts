"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { getShopTheLookInfo, getActiveLooks, getShopTheLookProducts, createShopTheLookInfo, updateLookOrder } from '../../services/shop-the-look.service'
import type { LookApiResponse, GetLooksResponse } from '../../types/shop-the-look.types'
import type { CreateShopTheLookRequest, CreateShopTheLookResponse } from '../../services/shop-the-look.service'
import type { Look } from '../../types/shop-the-look.types'

/**
 * Hook for fetching shop the look info using TanStack Query
 */
export function useShopTheLookInfoQuery() {
  return useQuery({
    queryKey: queryKeys.shopTheLook.looks(),
    queryFn: () => getShopTheLookInfo(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // After create/update flows we often navigate away and come back; always refetch on mount
    // so we don't show stale data from cache.
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Hook for fetching active looks using TanStack Query
 */
export function useActiveLooksQuery() {
  return useQuery({
    queryKey: queryKeys.shopTheLook.looks(),
    queryFn: () => getActiveLooks(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Ensure we always load latest looks when returning to the list page
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Hook for fetching products for shop the look selection using TanStack Query
 */
export function useShopTheLookProductsQuery() {
  return useQuery({
    queryKey: queryKeys.shopTheLook.products(),
    queryFn: () => getShopTheLookProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Hook for creating a shop the look using TanStack Query
 * Automatically invalidates and refetches the looks list after successful creation
 */
export function useCreateShopTheLookMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateShopTheLookRequest) => createShopTheLookInfo(data),
    onSuccess: async () => {
      // Mark stale + proactively refetch so callers navigating immediately will still see fresh data.
      await queryClient.invalidateQueries({
        queryKey: queryKeys.shopTheLook.looks(),
      })
      await queryClient.refetchQueries({
        queryKey: queryKeys.shopTheLook.looks(),
      })
    },
  })
}

/**
 * Hook for updating look order with optimistic updates
 * Provides instant UI feedback while syncing with the API in the background
 */
export function useUpdateLookOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (looksInNewOrder: Array<{ id: number | string; sequence: number }>) => 
      updateLookOrder(looksInNewOrder),
    onMutate: async (looksInNewOrder) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.shopTheLook.looks() })

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<GetLooksResponse>(queryKeys.shopTheLook.looks())

      // Optimistically update the cache with new order
      if (previousData) {
        // Create a map of id -> full look data for quick lookup
        const lookMap = new Map(previousData.looks.map(look => [look.id, look]))
        
        // Create a map of new sequences
        const sequenceMap = new Map(
          looksInNewOrder.map(({ id, sequence }) => [id, sequence])
        )

        // Reorder looks based on the sequence order (1, 2, 3, ...)
        // The looksInNewOrder array is already in the correct order
        const updatedLooks: Look[] = looksInNewOrder.map(({ id, sequence }) => {
          const existingLook = lookMap.get(id)
          if (existingLook) {
            return {
              ...existingLook,
              sequence: sequence,
              order: sequence,
            }
          }
          // Fallback if look not found (shouldn't happen)
          return {
            id,
            name: '',
            image_url: '',
            product_count: 0,
            updated_at: new Date().toISOString(),
            sequence: sequence,
            order: sequence,
            is_deleted: false,
            is_active: true,
          } as Look
        })

        // Optimistically update the cache
        queryClient.setQueryData<GetLooksResponse>(queryKeys.shopTheLook.looks(), {
          ...previousData,
          looks: updatedLooks,
        })
      }

      // Return context with previous data for rollback
      return { previousData }
    },
    onError: (err, looksInNewOrder, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.shopTheLook.looks(), context.previousData)
      }
      //console.error('Failed to update look order:', err)
    },
    onSettled: () => {
      // Refetch after a short delay.
      // Without this, a fast refetch can return the *old* order (eventual consistency),
      // causing a visible "snap back" right after drag-drop.
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.shopTheLook.looks() })
      queryClient.refetchQueries({ 
        queryKey: queryKeys.shopTheLook.looks(),
        
      })
      }, 800)
    },
  })
}

