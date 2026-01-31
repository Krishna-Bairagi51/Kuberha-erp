/**
 * TanStack Query Client Configuration
 * 
 * Optimized for:
 * - Fast initial loads (staleTime prevents refetches on mount)
 * - Minimal network requests (smart caching)
 * - Good UX (background refetches, no loading spinners on stale data)
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Creates a QueryClient with optimized defaults for this application.
 * 
 * Key optimizations:
 * - staleTime: 5 minutes - reduces unnecessary refetches
 * - gcTime: 10 minutes - keeps data cached longer  
 * - retry: 1 - fast failure for better UX
 * - refetchOnWindowFocus: false - prevents jarring refetches
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Only retry once on failure
        retry: 1,
        // Reduce aggressive refetching
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // Don't refetch on mount if data is still fresh
        refetchOnMount: false,
      },
      mutations: {
        // No retries for mutations - fail fast
        retry: 0,
      },
    },
  })
}

/**
 * Query keys for consistent cache management
 * Following TanStack Query best practices with hierarchical keys
 */
// Use simple bases to avoid self-references (prevents ReferenceError)
const authBase = ['auth'] as const
const inventoryBase = ['inventory'] as const
const supplierBase = ['supplier'] as const
const notificationBase = ['notifications'] as const
const ordersBase = ['orders'] as const
const shippingBase = ['shipping'] as const
const qcBase = ['qc'] as const
const dashboardBase = ['dashboard'] as const
const assetsManagementBase = ['assetsManagement'] as const
const chatBase = ['chat'] as const
const payoutBase = ['payout'] as const
const shopTheLookBase = ['shopTheLook'] as const

export const queryKeys = {
  auth: {
    all: authBase,
    state: () => [...authBase, 'state'] as const,
    user: () => [...authBase, 'user'] as const,
  },
  supplier: {
    all: supplierBase,
    states: () => [...supplierBase, 'states'] as const,
    list: (page?: number, limit?: number, search?: string, status?: string) => {
      const base = [...supplierBase, 'list'] as const
      const parts: (number | string)[] = []
      if (page !== undefined) parts.push(page)
      if (limit !== undefined) parts.push(limit)
      if (search !== undefined) parts.push(search)
      if (status !== undefined) parts.push(status)
      return parts.length > 0 ? [...base, ...parts] as const : base
    },
    detail: {
      all: [...supplierBase, 'detail'] as const,
      byId: (supplierId: string | number) => [...supplierBase, 'detail', String(supplierId)] as const,
    },
  },
  notifications: {
    all: notificationBase,
    list: (page?: number, limit?: number, status?: 'all' | 'read' | 'unread') => [...notificationBase, 'list', page, limit, status] as const,
  },
  inventory: {
    all: inventoryBase,
    products: {
      all: [...inventoryBase, 'products'] as const,
      seller: (page?: number, limit?: number, search?: string, status?: string) => {
        const base = [...inventoryBase, 'products', 'seller'] as const
        const parts: (number | string)[] = []
        if (page !== undefined) parts.push(page)
        if (limit !== undefined) parts.push(limit)
        if (search !== undefined) parts.push(search)
        if (status !== undefined) parts.push(status)
        return parts.length > 0 ? [...base, ...parts] as const : base
      },
      admin: (page?: number, limit?: number, search?: string, status?: string, vendor_id?: number) => {
        const base = [...inventoryBase, 'products', 'admin'] as const
        const parts: (number | string)[] = []
        if (page !== undefined) parts.push(page)
        if (limit !== undefined) parts.push(limit)
        if (search !== undefined) parts.push(search)
        if (status !== undefined) parts.push(status)
        if (vendor_id !== undefined) parts.push(vendor_id)
        return parts.length > 0 ? [...base, ...parts] as const : base
      },
      vendor: (vendorId: number, page?: number, limit?: number, search?: string, status?: string, category?: string) => {
        const base = [...inventoryBase, 'products', 'vendor', vendorId] as const
        const parts: (number | string)[] = []
        if (page !== undefined) parts.push(page)
        if (limit !== undefined) parts.push(limit)
        if (search !== undefined) parts.push(search)
        if (status !== undefined) parts.push(status)
        if (category !== undefined) parts.push(category)
        return parts.length > 0 ? [...base, ...parts] as const : base
      },
      vendorPending: (vendorId: number, page?: number, limit?: number, search?: string) => {
        const base = [...inventoryBase, 'products', 'vendorPending', vendorId] as const
        const parts: (number | string)[] = []
        if (page !== undefined) parts.push(page)
        if (limit !== undefined) parts.push(limit)
        if (search !== undefined) parts.push(search)
        return parts.length > 0 ? [...base, ...parts] as const : base
      },
      draft: (page?: number, limit?: number, search?: string) => 
        page !== undefined && limit !== undefined && search !== undefined
          ? [...inventoryBase, 'products', 'draft', page, limit, search] as const
          : page !== undefined && limit !== undefined
          ? [...inventoryBase, 'products', 'draft', page, limit] as const
          : [...inventoryBase, 'products', 'draft'] as const,
      adminDraft: (page?: number, limit?: number, search?: string) => 
        page !== undefined && limit !== undefined && search !== undefined
          ? [...inventoryBase, 'products', 'adminDraft', page, limit, search] as const
          : page !== undefined && limit !== undefined
          ? [...inventoryBase, 'products', 'adminDraft', page, limit] as const
          : [...inventoryBase, 'products', 'adminDraft'] as const,
    },
    product: {
      all: [...inventoryBase, 'product'] as const,
      detail: (productId: number) => [...inventoryBase, 'product', 'detail', productId] as const,
    },
    formData: () => [...inventoryBase, 'formData'] as const,
    categories: {
      all: [...inventoryBase, 'categories'] as const,
      ecom: () => [...inventoryBase, 'categories', 'ecom'] as const,
    },
    suppliers: {
      all: [...inventoryBase, 'suppliers'] as const,
      list: (page?: number, limit?: number, search?: string) => 
        page !== undefined && limit !== undefined && search !== undefined
          ? [...inventoryBase, 'suppliers', 'list', page, limit, search] as const
          : page !== undefined && limit !== undefined
          ? [...inventoryBase, 'suppliers', 'list', page, limit] as const
          : [...inventoryBase, 'suppliers', 'list'] as const,
    },
    leadTime: {
      all: [...inventoryBase, 'leadTime'] as const,
      templates: () => [...inventoryBase, 'leadTime', 'templates'] as const,
    },
  },
  orders: {
    all: ordersBase,
    history: {
      all: [...ordersBase, 'history'] as const,
      seller: (page?: number, limit?: number, search?: string, status?: string, vendor_id?: number) => {
        const base = [...ordersBase, 'history', 'seller'] as const
        const parts: (number | string)[] = []
        
        if (page !== undefined) parts.push(page)
        if (limit !== undefined) parts.push(limit)
        if (search !== undefined) parts.push(search)
        if (status !== undefined) parts.push(status) // Always include status if provided
        if (vendor_id !== undefined) parts.push(`vendor_${vendor_id}`) // Include vendor_id if provided
        
        return parts.length > 0 ? [...base, ...parts] as const : base
      },
      admin: (page?: number, limit?: number, search?: string, status?: string, vendor_id?: number) => {
        const base = [...ordersBase, 'history', 'admin'] as const
        const parts: (number | string)[] = []
        
        if (page !== undefined) parts.push(page)
        if (limit !== undefined) parts.push(limit)
        if (search !== undefined) parts.push(search)
        if (status !== undefined) parts.push(status) // Always include status if provided
        if (vendor_id !== undefined) parts.push(`vendor_${vendor_id}`) // Include vendor_id if provided
        
        return parts.length > 0 ? [...base, ...parts] as const : base
      },
      byUserType: (userType: 'seller' | 'admin', page?: number, limit?: number, search?: string, status?: string, vendor_id?: number) => {
        const base = [...ordersBase, 'history', userType] as const
        const parts: (number | string)[] = []
        
        if (page !== undefined) parts.push(page)
        if (limit !== undefined) parts.push(limit)
        if (search !== undefined) parts.push(search)
        if (status !== undefined) parts.push(status) // Always include status if provided
        if (vendor_id !== undefined) parts.push(`vendor_${vendor_id}`) // Include vendor_id if provided
        
        return parts.length > 0 ? [...base, ...parts] as const : base
      },
    },
    summary: {
      all: [...ordersBase, 'summary'] as const,
      seller: () => [...ordersBase, 'summary', 'seller'] as const,
      admin: () => [...ordersBase, 'summary', 'admin'] as const,
      byUserType: (userType: 'seller' | 'admin') => [...ordersBase, 'summary', userType] as const,
    },
    detail: {
      all: [...ordersBase, 'detail'] as const,
      byId: (orderId: number, userType?: 'seller' | 'admin') => 
        userType 
          ? [...ordersBase, 'detail', orderId, userType] as const
          : [...ordersBase, 'detail', orderId] as const,
    },
    sellerNameList: () => [...ordersBase, 'sellerNameList'] as const,
  },
  shipping: {
    all: shippingBase,
    list: {
      all: [...shippingBase, 'list'] as const,
      byUserType: (userType?: 'seller' | 'admin', page?: number, limit?: number, search?: string, status?: string) => {
        const base = userType ? [...shippingBase, 'list', userType] as const : [...shippingBase, 'list'] as const
        const parts: (number | string)[] = []
        if (page !== undefined) parts.push(page)
        if (limit !== undefined) parts.push(limit)
        if (search !== undefined) parts.push(search)
        if (status !== undefined) parts.push(status)
        return parts.length > 0 ? [...base, ...parts] as const : base
      },
    },
    byOrderId: (orderId: number, userType?: 'seller' | 'admin') => 
      userType 
        ? [...shippingBase, 'order', orderId, userType] as const
        : [...shippingBase, 'order', orderId] as const,
    insights: () => [...shippingBase, 'insights'] as const,
    boxDimensions: () => [...shippingBase, 'boxDimensions'] as const,
    items: (orderId: number) => [...shippingBase, 'items', orderId] as const,
  },
  qc: {
    all: qcBase,
    list: (page?: number, limit?: number, search?: string, status?: string, type?: string) => {
      const base = [...qcBase, 'list'] as const
      const parts: (number | string)[] = []
      if (page !== undefined) parts.push(page)
      if (limit !== undefined) parts.push(limit)
      if (search !== undefined) parts.push(search)
      if (status !== undefined) parts.push(status)
      if (type !== undefined) parts.push(type)
      return parts.length > 0 ? [...base, ...parts] as const : base
    },
    insights: () => [...qcBase, 'insights'] as const,
  },
  dashboard: {
    all: dashboardBase,
    summary: () => [...dashboardBase, 'summary'] as const,
    insights: () => [...dashboardBase, 'insights'] as const,
    recentOrders: (page?: number, limit?: number, search?: string) => 
      page !== undefined && limit !== undefined && search !== undefined
        ? [...dashboardBase, 'recentOrders', page, limit, search] as const
        : page !== undefined && limit !== undefined
        ? [...dashboardBase, 'recentOrders', page, limit] as const
        : [...dashboardBase, 'recentOrders'] as const,
    graphData: (startDate: string, endDate: string) => [...dashboardBase, 'graphData', startDate, endDate] as const,
    topCustomers: (startDate?: string, endDate?: string) => 
      startDate && endDate
        ? [...dashboardBase, 'topCustomers', startDate, endDate] as const        : [...dashboardBase, 'topCustomers'] as const,
    topCategories: (startDate?: string, endDate?: string) => 
      startDate && endDate
        ? [...dashboardBase, 'topCategories', startDate, endDate] as const
        : [...dashboardBase, 'topCategories'] as const,
    orderCountSummary: (startDate?: string, endDate?: string) => 
      startDate && endDate
        ? [...dashboardBase, 'orderCountSummary', startDate, endDate] as const
        : [...dashboardBase, 'orderCountSummary'] as const,
  },
  assetsManagement: {
    all: assetsManagementBase,
    colors: {
      all: [...assetsManagementBase, 'colors'] as const,
      dashboard: () => [...assetsManagementBase, 'colors', 'dashboard'] as const,
    },
    categories: {
      all: [...assetsManagementBase, 'categories'] as const,
      list: () => [...assetsManagementBase, 'categories', 'list'] as const,
    },
    brands: {
      all: [...assetsManagementBase, 'brands'] as const,
      approvedSellers: () => [...assetsManagementBase, 'brands', 'approvedSellers'] as const,
    },
  },
  chat: {
    all: chatBase,
    list: () => [...chatBase, 'list'] as const,
    messages: (sessionId: string) => [...chatBase, 'messages', sessionId] as const,
  },
  payout: {
    all: payoutBase,
    salesOverview: (timePeriod: string, startDate?: string, endDate?: string) => 
      startDate && endDate
        ? [...payoutBase, 'salesOverview', timePeriod, startDate, endDate] as const
        : [...payoutBase, 'salesOverview', timePeriod] as const,
    salesDetails: (timePeriod: string, startDate?: string, endDate?: string) => 
      startDate && endDate
        ? [...payoutBase, 'salesDetails', timePeriod, startDate, endDate] as const
        : [...payoutBase, 'salesDetails', timePeriod] as const,
    orderStatusBreakdown: (timePeriod: string, startDate?: string, endDate?: string) => 
      startDate && endDate
        ? [...payoutBase, 'orderStatusBreakdown', timePeriod, startDate, endDate] as const
        : [...payoutBase, 'orderStatusBreakdown', timePeriod] as const,
    topCustomers: (timePeriod: string, startDate?: string, endDate?: string) => 
      startDate && endDate
        ? [...payoutBase, 'topCustomers', timePeriod, startDate, endDate] as const
        : [...payoutBase, 'topCustomers', timePeriod] as const,
    revenueTrend: (filterType: string) => 
      [...payoutBase, 'revenueTrend', filterType] as const,
    whatsSelling: (filter: string) => 
      [...payoutBase, 'whatsSelling', filter] as const,
    supplierPayoutOverview: (timePeriod: string, startDate?: string, endDate?: string) => 
      startDate && endDate
        ? [...payoutBase, 'supplierPayoutOverview', timePeriod, startDate, endDate] as const
        : [...payoutBase, 'supplierPayoutOverview', timePeriod] as const,
    commissionDetails: (timePeriod: string, startDate?: string, endDate?: string, vendorId?: number) => 
      vendorId !== undefined && startDate && endDate
        ? [...payoutBase, 'commissionDetails', timePeriod, startDate, endDate, vendorId] as const
        : startDate && endDate
        ? [...payoutBase, 'commissionDetails', timePeriod, startDate, endDate] as const
        : [...payoutBase, 'commissionDetails', timePeriod] as const,
    gstSnapshot: (timePeriod: string, startDate?: string, endDate?: string) => 
      startDate && endDate
        ? [...payoutBase, 'gstSnapshot', timePeriod, startDate, endDate] as const
        : [...payoutBase, 'gstSnapshot', timePeriod] as const,
    settlementDashboard: (timePeriod: string, startDate?: string, endDate?: string) => 
      startDate && endDate
        ? [...payoutBase, 'settlementDashboard', timePeriod, startDate, endDate] as const
        : [...payoutBase, 'settlementDashboard', timePeriod] as const,
  },
  shopTheLook: {
    all: shopTheLookBase,
    looks: () => [...shopTheLookBase, 'looks'] as const,
    look: {
      all: [...shopTheLookBase, 'look'] as const,
      byId: (lookId: number | string) => [...shopTheLookBase, 'look', String(lookId)] as const,
    },
    products: () => [...shopTheLookBase, 'products'] as const,
  },
} as const

