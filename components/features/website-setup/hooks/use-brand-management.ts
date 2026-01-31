'use client'

/**
 * Brand Management Query Hooks
 * 
 * TanStack Query powered brand management hooks that provide:
 * - Instant data from cache (no loading flicker on navigation)
 * - Automatic cache invalidation
 * - Type-safe brand operations
 * - Reduced API calls through smart caching
 */

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query'
import { getApprovedSellerList, updateSellerBrandImage } from '../services/brand-management.service'
import type { SupplierListResponse } from '../types/brand-management.types'
import type { Brand, SupplierListItemWithImage } from '../types/brand-management.types'

// Re-export queryKeys for convenience
export { queryKeys }

/**
 * Map supplier list item to brand
 * Converts SupplierListItem from API to Brand format for display
 */
export function mapSupplierToBrand(supplier: SupplierListItemWithImage): Brand {
  // Use supplier_name as brand name if available, otherwise fall back to name
  // Display name uses the other field
  const brandName = supplier.supplier_name || supplier.name || 'Unknown Brand'
  const displayName = supplier.supplier_name && supplier.name && supplier.supplier_name !== supplier.name
    ? supplier.name
    : brandName

  return {
    id: String(supplier.id),
    name: brandName,
    displayName: displayName,
    imageUrl: supplier.image_url, // Map image_url from API to imageUrl
    bannerUrl: supplier.banner_url, // Map banner_url from API to bannerUrl
    description: supplier.description, // Map description from API
    productCount: supplier.product_count, // Map product_count from API
  }
}

/**
 * React Query hook for fetching approved sellers as brands
 * 
 * Benefits:
 * - Cached: Data is instant on subsequent mounts
 * - Deduped: Multiple components share the same query
 * - Smart refetch: Only refetches when explicitly invalidated or stale
 * - Automatic error handling and loading states
 */
export function useApprovedSellersQuery(enabled: boolean = true) {
  return useQuery<SupplierListResponse, Error>({
    queryKey: queryKeys.assetsManagement.brands.approvedSellers(),
    queryFn: () => getApprovedSellerList(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - brand data is relatively stable
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false, // Don't refetch if data is still fresh
    refetchOnWindowFocus: false, // Prevent jarring refetches
    refetchOnReconnect: true, // Refetch when network reconnects
  })
}

/**
 * Hook to get brands (mapped from approved sellers)
 * This hook transforms the supplier list response into Brand format
 */
export function useBrandsQuery(enabled: boolean = true) {
  const { data, isLoading, error, ...rest } = useApprovedSellersQuery(enabled)
  
  const brands: Brand[] = data?.record?.map(mapSupplierToBrand) || []
  
  return {
    brands,
    isLoading,
    error,
    ...rest,
  }
}

/**
 * Hook to invalidate approved sellers cache
 * Useful when you want to force a refetch (e.g., after approving a seller)
 */
export function useInvalidateApprovedSellers() {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.assetsManagement.brands.approvedSellers() })
  }
}

/**
 * React Query mutation hook for updating brand image
 * 
 * Benefits:
 * - Automatic cache invalidation on success
 * - Error handling with toast notifications
 * - Loading states
 */
export function useUpdateBrandImageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      brandName,
      imageFile, 
      description, 
      imageUrl,
      coverImageFile,
      coverImageUrl
    }: { 
      id: number | string
      brandName: string
      imageFile?: File | null
      description: string
      imageUrl?: string | null
      coverImageFile?: File | null
      coverImageUrl?: string | null
    }) =>
      updateSellerBrandImage(id, brandName, description, imageFile, imageUrl, coverImageFile, coverImageUrl),
    onSuccess: (response) => {
      // Invalidate and refetch brands cache
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assetsManagement.brands.approvedSellers() 
      })
      queryClient.refetchQueries({ 
        queryKey: queryKeys.assetsManagement.brands.approvedSellers(),
        
      })
      
      if (response.status_code === 200) {
        toast.success('Brand image updated successfully')
      } else {
        toast.error(response.message || 'Failed to update brand image')
      }
    },
    onError: (error: any) => {
      // Extract exact error message from API response
      let errorMessage = 'Failed to update brand image. Please try again.'
      
      if (error?.body?.message) {
        if (typeof error.body.message === 'object' && error.body.message?.message) {
          // Handle nested error structure: { message: { message: "...", status_code: 400 } }
          errorMessage = error.body.message.message
        } else if (typeof error.body.message === 'string') {
          // Handle simple message string
          errorMessage = error.body.message
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    },
  })
}

