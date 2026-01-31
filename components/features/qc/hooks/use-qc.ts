"use client"

import { useState, useCallback } from 'react'
import { qcService } from '../services/qc.service'
import type { UserType, UseQCOptions, UseQCReturn } from '../types/qc.types'

export function useQC(options: UseQCOptions = {}): UseQCReturn {
  const { userType = 'seller' } = options
  
  // Loading states
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  
  // Error state
  const [error, setError] = useState<string | null>(null)

  // Admin: Approve QC
  const approveQC = useCallback(async (qcId: number, qcType: string): Promise<boolean> => {
    if (userType !== 'admin') {
      setError('Only admin can approve QC')
      return false
    }
    
    setIsApproving(true)
    setError(null)
    
    try {
      const response = await qcService.approveQC(qcId, qcType)
      
      if (response.status_code === 200) {
        return true
      } else {
        throw new Error(response.message || 'Failed to approve QC')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve QC')
      return false
    } finally {
      setIsApproving(false)
    }
  }, [userType])

  // Admin: Reject QC
  const rejectQC = useCallback(async (qcId: number, qcType: string, reason: string): Promise<boolean> => {
    if (userType !== 'admin') {
      setError('Only admin can reject QC')
      return false
    }
    
    if (!reason.trim()) {
      setError('Rejection reason is required')
      return false
    }
    
    setIsRejecting(true)
    setError(null)
    
    try {
      const response = await qcService.rejectQC(qcId, qcType, reason)
      
      if (response.status_code === 200) {
        return true
      } else {
        throw new Error(response.message || 'Failed to reject QC')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject QC')
      return false
    } finally {
      setIsRejecting(false)
    }
  }, [userType])

  // Seller: Update process status (no images)
  const updateProcessStatus = useCallback(async (orderLineId: number, type: string): Promise<boolean> => {
    setIsUpdatingStatus(true)
    setError(null)
    
    try {
      const response = await qcService.updateProcessStatus({
        order_line_id: orderLineId,
        type,
      })
      
      if (response.status_code === 200) {
        return true
      } else {
        throw new Error(response.message || 'Failed to update process status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update process status')
      return false
    } finally {
      setIsUpdatingStatus(false)
    }
  }, [])

  // Seller: Update process status with images
  const updateProcessStatusWithImages = useCallback(async (
    orderLineId: number, 
    type: string, 
    images: File[]
  ): Promise<boolean> => {
    if (!images.length) {
      setError('At least one image is required')
      return false
    }
    
    setIsUpdatingStatus(true)
    setError(null)
    
    try {
      const response = await qcService.updateProcessStatusWithImages({
        order_line_id: orderLineId,
        type,
        images,
      })
      
      if (response.status_code === 200) {
        return true
      } else {
        throw new Error(response.message || 'Failed to update process status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update process status')
      return false
    } finally {
      setIsUpdatingStatus(false)
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isApproving,
    isRejecting,
    isUpdatingStatus,
    error,
    approveQC,
    rejectQC,
    updateProcessStatus,
    updateProcessStatusWithImages,
    clearError,
    getStatusColor: qcService.getQCStatusColor,
    formatQCType: qcService.formatQCType,
  }
}

export default useQC

