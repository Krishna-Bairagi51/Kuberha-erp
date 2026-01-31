"use client"

import { useState, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModernSidebar } from "@/components/shared/layout/modern-sidebar"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useAuthQuery } from "@/hooks"
import type { UserType } from "@/lib/services/auth.service"

interface DashboardLayoutProps {
  /** Expected user type for this dashboard */
  userType: UserType
  /** Active tab identifier */
  activeTab: string
  /** Callback when tab changes */
  onTabChange: (tab: string) => void
  /** Whether a slider is open (affects sidebar styling) */
  isSliderOpen?: boolean
  /** Content to render */
  children: ReactNode
}

/**
 * Unified Dashboard Layout Component
 * Handles authentication, sidebar, and layout structure for both seller and admin dashboards
 */
export function DashboardLayout({
  userType,
  activeTab,
  onTabChange,
  isSliderOpen = false,
  children,
}: DashboardLayoutProps) {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuthQuery({
    expectedUserType: userType,
    redirectOnFail: true,
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // If not authenticated and redirecting, return null immediately to prevent any rendering
  // The redirect happens synchronously in useAuthQuery, so this prevents flash of content
  if (!isAuthenticated && !isLoading) {
    return null
  }

  // Show loading spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed Sidebar */}
      <ModernSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isSliderOpen={isSliderOpen}
      />

      {/* Main Content Area - Properly spaced from sidebar */}
      <div
        className={`fixed top-0 right-0 bottom-0 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "left-[102px]" : "left-[280px]"
        }`}
      >
        <main id="dashboard-scroll-root" className="flex-1 overflow-auto scrollbar-hide bg-white border border-gray-200 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

