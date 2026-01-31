'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import PageHeader from '@/components/shared/layout/page-header'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TimePeriod } from '@/components/shared/ui/time-picker'
import { useNotification } from '../providers'
import { useNotificationsQuery, useUpdateNotificationMutation } from '../hooks/use-notification-query'
import { useRouter } from 'next/navigation'
import type { Notification, NotificationItem, NotificationType } from '../types/notification.types'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  return `${Math.floor(diffInSeconds / 31536000)}y ago`
}

// Helper function to format date time
function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Helper function to determine notification type based on priority and content
function getNotificationType(notification: Notification): NotificationType {
  // Check if type is already set (backward compatibility)
  if (notification.type) {
    return notification.type
  }
  
  // Determine type based on priority or content
  const priority = notification.priority || ''
  const title = notification.title?.toLowerCase() || ''
  const message = notification.message?.toLowerCase() || ''
  
  // High priority notifications
  if (priority === '3' || priority === '2') {
    return 'error'
  }
  
  // Check for success keywords
  if (title.includes('approved') || title.includes('success') || message.includes('approved')) {
    return 'success'
  }
  
  // Check for warning keywords
  if (title.includes('awaiting') || title.includes('pending') || title.includes('request')) {
    return 'warning'
  }
  
  // Check for error keywords
  if (title.includes('rejected') || title.includes('failed') || title.includes('error')) {
    return 'error'
  }
  
  // Default to info
  return 'info'
}

// Convert API Notification to NotificationItem
function convertToNotificationItem(notification: Notification): NotificationItem {
  return {
    id: notification.id.toString(),
    title: notification.title,
    description: notification.description || notification.message,
    timeAgo: formatTimeAgo(notification.write_date || notification.create_date),
    dateTime: formatDateTime(notification.write_date || notification.create_date),
    type: getNotificationType(notification),
    unread: notification.unread ?? !notification.is_read,
    originalNotification: notification,
  }
}

function NotificationCard({ 
  item, 
  onClick 
}: { 
  item: NotificationItem
  onClick: (notification: Notification) => void
}) {
  return (
    <div 
      className={`relative rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md cursor-pointer ${
        item.unread ? 'border-l-4 border-l-secondary-600' : 'border-gray-200'
      }`}
      onClick={() => onClick(item.originalNotification)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
            {item.title}
          </h3>
          <p className="mt-1 text-xs text-gray-600 leading-snug line-clamp-2">
            {item.description}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
            <span>{item.timeAgo}</span>
            <span>•</span>
            <span>{item.dateTime}</span>
          </div>
        </div>
        {item.unread && (
          <div className="mt-0.5 shrink-0">
            <span className="inline-block h-2 w-2 rounded-full bg-secondary-600" />
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationCompactCard({ 
  item, 
  onClick 
}: { 
  item: NotificationItem
  onClick: (notification: Notification) => void
}) {
  return (
    <div 
      className={`relative rounded-lg border bg-white px-3 py-2 transition-all hover:bg-gray-50 mx-[8px] mb-2 cursor-pointer ${
        item.unread ? 'border-l-4 border-l-secondary-600' : 'border-gray-200'
      }`}
      onClick={() => onClick(item.originalNotification)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-semibold text-gray-900 truncate">
            {item.title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-600 leading-snug line-clamp-2">
            {item.description}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
            <span>{item.timeAgo}</span>
            <span>•</span>
            <span className="whitespace-nowrap truncate">{item.dateTime}</span>
          </div>
        </div>
        {item.unread && (
          <div className="mt-0.5 shrink-0">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-secondary-600" />
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationSection({ showFooter = false, variant = 'full' }: { showFooter?: boolean, variant?: 'full' | 'slider' }) {
  const router = useRouter()
  const updateNotificationMutation = useUpdateNotificationMutation()
  const [search, setSearch] = React.useState('')
  
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimePeriod>('today')
  
  // Read initial state from URL parameters
  const getUrlParams = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        activeTab: 'all' as const,
        page: 1,
        pageSize: 10,
      }
    }
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('notificationTab') || 'all'
    const validTab = tab === 'all' || tab === 'unread' || tab === 'read' ? tab : 'all'
    return {
      activeTab: validTab as 'all' | 'unread' | 'read',
      page: parseInt(urlParams.get('notificationPage') || '1', 10),
      pageSize: parseInt(urlParams.get('notificationItemsPerPage') || '10', 10),
    }
  }, [])

  // Initialize state from URL
  const initialUrlParams = getUrlParams()
  const [page, setPage] = React.useState(initialUrlParams.page)
  const [pageSize, setPageSize] = React.useState(initialUrlParams.pageSize)
  const [activeTab, setActiveTab] = React.useState<'all' | 'unread' | 'read'>(initialUrlParams.activeTab)
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  // Parse URL params on mount and popstate
  React.useEffect(() => {
    if (variant !== 'full') return // Only handle URL params for full variant
    
    const parseUrlParams = () => {
      const params = getUrlParams()
      setActiveTab(params.activeTab)
      setPage(params.page)
      setPageSize(params.pageSize)
    }

    parseUrlParams()

    // Listen for popstate (browser back/forward)
    const handlePopState = () => {
      parseUrlParams()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [getUrlParams, variant])

  // Update URL when state changes (but NOT for search)
  React.useEffect(() => {
    if (variant !== 'full' || typeof window === 'undefined') return

    const url = new URL(window.location.href)
    
    // Update activeTab
    if (activeTab !== 'all') {
      url.searchParams.set('notificationTab', activeTab)
    } else {
      url.searchParams.delete('notificationTab')
    }
    
    // Update page
    if (page > 1) {
      url.searchParams.set('notificationPage', String(page))
    } else {
      url.searchParams.delete('notificationPage')
    }
    
    // Update pageSize
    if (pageSize !== 10) {
      url.searchParams.set('notificationItemsPerPage', String(pageSize))
    } else {
      url.searchParams.delete('notificationItemsPerPage')
    }
    
    // Use replaceState to avoid adding to history on every state change
    // pushState is used in handlers for navigation
    window.history.replaceState({}, '', url.toString())
  }, [activeTab, page, pageSize, variant])

  // For slider variant, use provider (no pagination)
  // For full variant, use query hook with pagination and status filter
  const { notifications: providerNotifications } = useNotification()
  const { data: paginatedData, isLoading: isLoadingPaginated } = useNotificationsQuery(
    variant === 'full',
    variant === 'full' ? page : 1,
    variant === 'full' ? pageSize : 10,
    variant === 'full' ? activeTab : 'all'
  )

  // Track when page or tab changes to show loading
  // Only show loading when actually fetching data
  React.useEffect(() => {
    if (variant === 'full') {
      setIsTransitioning(isLoadingPaginated)
    } else {
      setIsTransitioning(false)
    }
  }, [isLoadingPaginated, variant])

  // Handle tab change - don't set loading immediately, let it be controlled by query state
  const handleTabChange = React.useCallback((tab: 'all' | 'unread' | 'read') => {
    setActiveTab(tab)
    setPage(1)
    
    // Update URL with pushState for navigation
    if (variant === 'full' && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (tab !== 'all') {
        url.searchParams.set('notificationTab', tab)
      } else {
        url.searchParams.delete('notificationTab')
      }
      url.searchParams.delete('notificationPage') // Reset to page 1
      window.history.pushState({}, '', url.toString())
    }
  }, [variant])

  const handlePageChange = React.useCallback((newPage: number) => {
    setPage(newPage)
    
    // Update URL with pushState for navigation
    if (variant === 'full' && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (newPage > 1) {
        url.searchParams.set('notificationPage', String(newPage))
      } else {
        url.searchParams.delete('notificationPage')
      }
      window.history.pushState({}, '', url.toString())
    }
  }, [variant])

  // Use paginated data for full variant, provider data for slider
  const apiNotifications = variant === 'full' 
    ? (paginatedData?.notifications || [])
    : providerNotifications

  // Handle notification click
  const handleNotificationClick = React.useCallback(async (notification: Notification) => {
    // Only update if notification is unread
    if (!notification.is_read) {
      try {
        // Prepare the update request
        const updateRequest = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          res_model: notification.res_model,
          res_id: notification.res_id,
          priority: notification.priority,
          redirect_url: notification.redirect_url || '',
        }

        // Update notification (mark as read)
        await updateNotificationMutation.mutateAsync(updateRequest)
      } catch (error) {
        // Don't navigate if update fails
        return
      }
    }

    // Navigate to redirect_url if provided
    if (notification.redirect_url) {
      router.push(notification.redirect_url)
    }
  }, [updateNotificationMutation, router])

  const handlePeriodChange = React.useCallback((period: TimePeriod) => {
    setSelectedPeriod(period)
  }, [])


  // Convert API notifications to NotificationItem format
  const notifications = React.useMemo(() => {
    return apiNotifications.map(convertToNotificationItem)
  }, [apiNotifications])

  const counts = React.useMemo(() => {
    // For full variant with server-side filtering, record_count reflects the current filter
    if (variant === 'full' && paginatedData?.record_count !== undefined) {
      const currentFilterCount = paginatedData.record_count
      const currentPageUnread = notifications.filter(n => n.unread).length
      const currentPageRead = notifications.filter(n => !n.unread).length
      const currentPageTotal = notifications.length
      
      if (activeTab === 'all') {
        // When on 'all', record_count is total
        const total = currentFilterCount
        // Estimate unread/read based on current page ratio
        const unreadRatio = currentPageTotal > 0 ? currentPageUnread / currentPageTotal : 0
        const unread = Math.round(total * unreadRatio)
        const read = total - unread
        return { total, unread, read }
      } else if (activeTab === 'unread') {
        // When on 'unread', record_count is unread count
        const unread = currentFilterCount
        // Estimate total and read based on current page ratio
        const unreadRatio = currentPageTotal > 0 ? currentPageUnread / currentPageTotal : 1
        const total = unreadRatio > 0 ? Math.round(unread / unreadRatio) : unread
        const read = total - unread
        return { total, unread, read }
      } else {
        // When on 'read', record_count is read count
        const read = currentFilterCount
        // Estimate total and unread based on current page ratio
        const readRatio = currentPageTotal > 0 ? currentPageRead / currentPageTotal : 1
        const total = readRatio > 0 ? Math.round(read / readRatio) : read
        const unread = total - read
        return { total, unread, read }
      }
    }
    // For slider variant or when no pagination data, use local counts
    const total = notifications.length
    const unread = notifications.filter(n => n.unread).length
    const read = total - unread
    return { total, unread, read }
  }, [notifications, variant, paginatedData, activeTab])

  const filtered = React.useMemo(() => {
    // For full variant with server-side pagination, status filtering is done on server
    // We only do client-side filtering for search
    // For slider variant, we do both search and tab filtering client-side
    return notifications.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.description.toLowerCase().includes(search.toLowerCase())
      
      // For full variant, tab filtering is done server-side, so skip it here
      if (variant === 'full') {
        return matchesSearch
      }
      
      // For slider variant, do both search and client-side tab filtering
      const matchesTab =
        activeTab === 'all' ? true :
        activeTab === 'unread' ? !!n.unread :
        activeTab === 'read' ? !n.unread : true
      return matchesSearch && matchesTab
    })
  }, [notifications, search, activeTab, variant])

  // For full variant, use server-side pagination (total pages from API)
  // For slider variant, use client-side pagination
  const totalPages = variant === 'full' && paginatedData?.total_pages !== undefined
    ? paginatedData.total_pages
    : Math.max(1, Math.ceil(filtered.length / pageSize))
  
  const currentPage = Math.min(page, totalPages)
  
  // For full variant, items are already paginated by server
  // For slider variant, use client-side pagination
  const paginated = React.useMemo(() => {
    if (variant === 'full') {
      // Server already paginated, just return filtered results
      return filtered
    }
    // Client-side pagination for slider
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize, variant])
  
  const itemsToRender = variant === 'slider' ? filtered : paginated

  const goToPage = (p: number) => {
    const newPage = Math.min(Math.max(p, 1), totalPages)
    if (variant === 'full') {
      handlePageChange(newPage)
    } else {
      setPage(newPage)
    }
  }
  const tabs = [
    { key: 'all' as const, label: `All` },
    { key: 'unread' as const, label: `Unread` },
    { key: 'read' as const, label: `Read` },
  ]

  const getPageNumbers = () => {
    const pages: Array<number | '...'> = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
    return pages
  }

  return (
    <>
      {variant === 'full' && (
        <PageHeader title="Notifications & Alerts" />
      )}

      {/* Section heading row */}
      <div className={`space-y-3 ${variant === 'full' ? 'mt-[24px] mx-[8px] border border-200 rounded-lg' : ''}` }>
        {variant === 'full' && (
        <div className="flex items-center justify-between px-[8px] py-[15px] border-b border-200">
        <div className="flex items-center gap-2">
          <h2 className="font-medium font-semibold text-gray-900 font-urbanist label-1">New Notifications</h2>
        </div>
        {/* <div className="flex items-center gap-2">
          <Button className="h-8">Mark all as read</Button>
        </div> */}
        </div>
        )}

      {variant === 'full' && (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative mx-[8px]">
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[260px]"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>
        {/* Tabs with counts - aligned right */}
        <div className="flex items-center gap-1 overflow-x-auto mr-[8px]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                activeTab === tab.key
                  ? 'bg-secondary-900 text-white border-secondary-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      )}

      {variant === 'full' && <Separator className="bg-slate-200" />}

      <div className={`space-y-2 relative ${variant === 'full' ? 'px-[8px] py-2' : 'py-2'}`}>
          {/* Loading overlay for pagination and tab changes */}
          {variant === 'full' && isTransitioning && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center min-h-[400px] rounded-lg">
              <LoadingSpinner/>
            </div>
          )}
          
          {variant === 'full' && !isTransitioning && isLoadingPaginated && filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white">
              <LoadingSpinner />
            </div>
          ) : !isTransitioning && filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white">
              <svg className="h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <div className="mt-3 text-lg font-semibold text-gray-700">No notifications found</div>
              <div className="mt-1 text-sm text-gray-500 px-4 text-center">
                {search
                  ? `No results for "${search}". Try adjusting your search or filters.`
                  : 'You have no notifications to show right now.'}
              </div>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-4 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            itemsToRender.map((item) => (
              variant === 'slider' ? (
                <NotificationCompactCard key={item.id} item={item} onClick={handleNotificationClick} />
              ) : (
                <NotificationCard key={item.id} item={item} onClick={handleNotificationClick} />
              )
            ))
          )}
      </div>

      {variant === 'full' && filtered.length > 0 && (
      <div className="px-5 py-[15px] border-t border-gray-200 flex items-center justify-between rounded-br-[5px] rounded-bl-[5px]">
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600">Row Per Page</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none bg-white hover:bg-gray-50 min-w-[60px]">
              {pageSize}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[60px] min-w-[60px]">
              {[10, 25, 50, 100].map((value) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => {
                    setPageSize(value)
                    setPage(1)
                    
                    // Update URL with pushState for navigation
                    if (variant === 'full' && typeof window !== 'undefined') {
                      const url = new URL(window.location.href)
                      if (value !== 10) {
                        url.searchParams.set('notificationItemsPerPage', String(value))
                      } else {
                        url.searchParams.delete('notificationItemsPerPage')
                      }
                      url.searchParams.delete('notificationPage') // Reset to page 1
                      window.history.pushState({}, '', url.toString())
                    }
                  }}
                  className={`cursor-pointer focus:bg-gray-100 focus:text-gray-900 ${pageSize === value ? 'bg-secondary-900 text-white' : ''}`}
                >
                  {value}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-sm text-gray-600">Entries</span>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, index) => (
              p === '...' ? (
                <span key={index} className="px-2 text-sm text-gray-500">...</span>
              ) : (
                <button
                  key={index}
                  onClick={() => goToPage(p as number)}
                  className={`w-8 h-8 text-sm rounded-full border flex items-center justify-center ${
                    currentPage === p
                      ? 'text-white bg-secondary-900'
                      : 'text-gray-700 hover:bg-gray-200 border-gray-200 bg-white'
                  }`}
                >
                  {p}
                </button>
              )
            ))}
          </div>
          <button 
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      )}

      {showFooter && (
        <div className="pt-2">
          <Button className="w-full" variant="default">
            View All Notifications
          </Button>
        </div>
      )}
      </div>
    </>
  )
}

export default NotificationSection

