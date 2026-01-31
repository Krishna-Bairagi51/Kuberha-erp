// Status and styling utilities for shipping feature
// Handles status badge styling and progress bar mapping

export interface ShippingProgressStage {
  label: string
  status: 'completed' | 'in-progress' | 'pending'
  step: number
}

// ============================================================================
// Status Badge Styling
// ============================================================================

/**
 * Get status badge CSS classes based on status string
 */
export function getStatusBadgeStyle(status: string) {
  if (status === 'Cancelled') {
    return { backgroundColor: '#FEE2E2', borderColor: '#FECACA', color: '#DC2626' }
  }
  if (status === 'In Transit') {
    return { backgroundColor: '#FFEED0', borderColor: '#FBE1B2', color: '#E59213' }
  }
  if (status === 'Delivery in Progress') {
    return { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', color: '#059669' }
  }
  return { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', color: '#6B7280' }
}

/**
 * Get status badge Tailwind classes for table display
 */
export function getStatusBadgeClasses(status: string): string {
  const s = String(status).toLowerCase()
  if (s.includes('shipped')) return 'bg-[#FFF7E6] text-[#BC7810] border-[#FBE1B2]'
  if (s.includes('in transit')) return 'bg-[#E7F1FF] text-[#0B5ED7] border-[#BBD5FF]'
  if (s.includes('destination')) return 'bg-[#EAF7E8] text-[#1B8E2D] border-[#CDEFC8]'
  if (s.includes('out for delivery')) return 'bg-[#FFF7E6] text-[#BC7810] border-[#FBE1B2]'
  if (s.includes('exception') || s.includes('rto') || s.includes('ndr')) return 'bg-red-50 text-red-700 border-red-200'
  if (s.includes('delivered')) return 'bg-green-50 text-green-700 border-green-200'
  return 'bg-gray-50 text-gray-700 border-gray-200'
}

// ============================================================================
// Progress Bar Mapping
// ============================================================================

/**
 * Map shipment_status to progress bar stages with proper coloring
 */
export function mapShipmentStatusToProgress(shipmentStatus: string | undefined): ShippingProgressStage[] {
  const allStages: ShippingProgressStage[] = [
    { label: 'Pickup Scheduled', status: 'pending', step: 1 },
    { label: 'Pickup Done', status: 'pending', step: 2 },
    { label: 'In Transit', status: 'pending', step: 3 },
    { label: 'Out For Delivery', status: 'pending', step: 4 },
    { label: 'Delivered', status: 'pending', step: 5 }
  ]

  if (!shipmentStatus) {
    return allStages
  }

  const isCancelled = shipmentStatus === 'cancelled'
  
  if (isCancelled) {
    return allStages.map((stage, index) => {
      if (index < 4) {
        return { ...stage, status: 'completed' as const }
      } else {
        return { label: 'Cancelled', status: 'pending' as const, step: 5 }
      }
    })
  }

  // Map status to stage index
  const statusToStep: Record<string, number> = {
    'pickup_scheduled': 1,
    'pickup_done': 2,
    'in_transit': 3,
    'out_for_delivery': 4,
    'delivered': 5
  }

  const currentStep = statusToStep[shipmentStatus] || 0

  return allStages.map((stage, index) => {
    const stepNumber = index + 1
    
    if (stepNumber < currentStep) {
      return { ...stage, status: 'completed' as const }
    } else if (stepNumber === currentStep) {
      return { ...stage, status: 'completed' as const }
    } else if (stepNumber === currentStep + 1) {
      return { ...stage, status: 'in-progress' as const }
    } else {
      return { ...stage, status: 'pending' as const }
    }
  })
}

/**
 * Map shipment_status to display string
 */
export function formatShipmentStatusDisplay(shipmentStatus: string | undefined): string {
  const statusMap: Record<string, string> = {
    'pickup_scheduled': 'Pickup Scheduled',
    'pickup_done': 'Pickup Done',
    'in_transit': 'In Transit',
    'out_for_delivery': 'Out For Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  }
  return statusMap[shipmentStatus || ''] || shipmentStatus || ''
}

