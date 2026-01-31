"use client"

import { ReactNode, Suspense, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/shared/layout"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { SellerDashboardProvider, useSellerDashboard } from "./context"

// Lazy load ChatbotWidget
const ChatbotWidget = dynamic(
  () => import("@/components/features/chat").then((mod) => ({ default: mod.ChatbotWidget })),
  { ssr: false }
)

// Routes that don't have file-based pages yet (coming soon)
// All other routes use file-based routing: /seller-dashboard/{route-name}
const COMING_SOON_ROUTES = [
  "purchase-history",
  "exceptions-rto",
  "finance-reconciliation",
  "insights-performance",
  "post-order-feedback",
  "profile",
  "settings",
  "support",
]

function SellerDashboardLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSliderOpen } = useSellerDashboard()

  // Determine active tab from pathname or query params
  const activeTab = useMemo(() => {
    // If we're on the main dashboard path, check query params for coming soon routes
    if (pathname === "/seller-dashboard") {
      const tabParam = searchParams.get("tab")
      return tabParam || "home" // Return "home" if no tab (for sidebar highlighting)
    }
    
    // For file-based routes, extract the tab ID from the pathname
    // e.g., "/seller-dashboard/inventory" → "inventory"
    // e.g., "/seller-dashboard/order-history" → "order-history"
    const pathSegments = pathname.split("/").filter(Boolean)
    if (pathSegments.length >= 2 && pathSegments[0] === "seller-dashboard") {
      return pathSegments[1] // Return the route segment as the tab ID
    }
    
    return "home"
  }, [pathname, searchParams])

  // Handle tab change - navigate to the appropriate route
  const handleTabChange = (tab: string) => {
    // If clicking "home", navigate to base dashboard (no route)
    if (tab === "home") {
      router.push("/seller-dashboard")
      return
    }
    
    // Coming soon routes use query params (they don't have file-based pages yet)
    if (COMING_SOON_ROUTES.includes(tab)) {
      router.push(`/seller-dashboard?tab=${tab}`)
    } else {
      // All other routes use file-based routing: /seller-dashboard/{tab}
      router.push(`/seller-dashboard/${tab}`)
    }
  }

  // Check if we're on the AI chat page (shouldn't show widget)
  const isAiChatPage = pathname === "/seller-dashboard/ask-kuberha-ai" || activeTab === "ask-kuberha-ai"

  return (
    <DashboardLayout
      userType="seller"
      activeTab={activeTab}
      onTabChange={handleTabChange}
      isSliderOpen={isSliderOpen}
    >
      {children}
      {!isAiChatPage && (
        <Suspense fallback={null}>
          <ChatbotWidget />
        </Suspense>
      )}
    </DashboardLayout>
  )
}

export default function SellerDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SellerDashboardProvider>
        <SellerDashboardLayoutInner>
          {children}
        </SellerDashboardLayoutInner>
      </SellerDashboardProvider>
    </Suspense>
  )
}
