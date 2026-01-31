import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query'
import { qcService } from '../services/qc.service'
import type { QCInsightsData } from '../types/qc.types'

/**
 * Query key factory for QC insights
 * Uses centralized query keys for consistency
 */
export const qcInsightsKeys = {
  all: () => queryKeys.qc.insights(),
  detail: () => [...queryKeys.qc.insights(), 'detail'] as const,
}

/**
 * Hook to fetch QC insights and performance data using TanStack Query
 * Replaces useState + useEffect pattern with direct query
 * 
 * @example
 * const { data, isLoading, error, refetch } = useQCInsights()
 */
export function useQCInsights() {
  const {
    data,
    isLoading,
    error,
    refetch,
    isError,
  } = useQuery({
    queryKey: qcInsightsKeys.detail(),
    queryFn: async () => {
      const result = await qcService.getQCInsightsAndPerformance()
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch QC insights')
      }
      
      return result.data.record
    },
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    retry: 2,
    refetchOnWindowFocus: false, // Respect staleTime - don't refetch if data is fresh
    refetchOnMount: false, // Don't refetch on mount if data is fresh
  })

  return {
    insights: data ?? null,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  }
}

/**
 * Hook to get dashboard metrics with fallback values
 * Derived from insights data
 */
export function useQCDashboardMetrics() {
  const { insights, isLoading, error } = useQCInsights()

  const metrics = {
    pending_mfg_qc: insights?.pending_mfg_qc ?? 0,
    pending_pkg_qc: insights?.pending_pkg_qc ?? 0,
    pkg_qc_rejected: insights?.pkg_qc_rejected ?? 0,
    mfg_qc_rejected: insights?.mfg_rejected ?? 0,
    ready_to_ship: insights?.ready_to_ship ?? 0,
  }

  return {
    metrics,
    isLoading,
    error,
  }
}

/**
 * Utility to invalidate QC insights cache
 * Use after QC approval/rejection to refresh data
 */
export function useInvalidateQCInsights() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: qcInsightsKeys.all() })
  }
}

