"use client"

import { Suspense, useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ShoppingCart,
  Sparkles,
  ClipboardCheck,
  Warehouse,
  Truck,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  User,
  HelpCircle,
  Settings,
  Bell,
} from "lucide-react"

import { ComingSoonSection } from "@/components/shared"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"
import { useAdminDashboard } from "./context"
import { useDashboardScrollPersistence } from "@/hooks/use-dashboard-scroll-persistence"
import { useSellerSummaryQuery, useSellerInsightsQuery } from "@/components/features/dashboard/hooks/use-dashboard-query"

// Routes that don't have file-based pages yet (coming soon)
// All other routes use file-based routing: /admin-dashboard/{route-name}
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

// Lazy load heavy components to reduce initial bundle size
const DashboardContent = dynamic(
  () => import("@/components/features/dashboard").then((mod) => ({ default: mod.DashboardContent })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

// Coming soon configuration for non-migrated routes
const COMING_SOON_CONFIGS: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  "purchase-history": {
    title: "Purchase History",
    description: "Track all your purchase orders and supplier transactions.",
    icon: <ShoppingCart className="h-16 w-16 text-indigo-700" />,
  },
  "exceptions-rto": {
    title: "Exceptions & RTO",
    description: "View and manage all your exceptions and RTO transactions.",
    icon: <AlertTriangle className="h-16 w-16 text-indigo-700" />,
  },
  "finance-reconciliation": {
    title: "Finance & Reconciliation",
    description: "View and manage all your finance and reconciliation transactions.",
    icon: <TrendingUp className="h-16 w-16 text-indigo-700" />,
  },
  "insights-performance": {
    title: "Insights & Performance",
    description: "View and manage all your insights and performance transactions.",
    icon: <Lightbulb className="h-16 w-16 text-indigo-700" />,
  },
  "post-order-feedback": {
    title: "Post Order & Feedback",
    description: "View and manage all your post order and feedback transactions.",
    icon: <MessageSquare className="h-16 w-16 text-indigo-700" />,
  },
  profile: {
    title: "Profile",
    description: "View and manage your profile.",
    icon: <User className="h-16 w-16 text-indigo-700" />,
  },
  settings: {
    title: "Settings",
    description: "View and manage your settings.",
    icon: <Settings className="h-16 w-16 text-indigo-700" />,
  },
  support: {
    title: "Support",
    description: "View and manage your support.",
    icon: <HelpCircle className="h-16 w-16 text-indigo-700" />,
  },
  "ask-kuberha-ai": {
    title: "Casa CarigarAI",
    description: "View and manage your Casa CarigarAI.",
    icon: <Sparkles className="h-16 w-16 text-indigo-700" />,
  },
  notifications: {
    title: "Notifications",
    description: "View and manage your notifications.",
    icon: <Bell className="h-16 w-16 text-indigo-700" />,
  },
}

export default function AdminDashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setIsSliderOpen, section, sectionId, onSectionChange } = useAdminDashboard()
  
  const scrollPositionsRef = useRef<Record<string, number>>({})
  const prevSectionRef = useRef<string | null>(null)

  // Get the tab from query params for non-migrated routes
  const tab = searchParams.get("tab")
  
  // Get dashboard data loading state for scroll restoration (only when on dashboard home)
  const { data: summary, isLoading: summaryLoading } = useSellerSummaryQuery({ enabled: !tab })
  const { data: insights, isLoading: insightsLoading } = useSellerInsightsQuery({ enabled: !tab })
  
  // Scroll persistence: restore scroll when dashboard home is loaded
  useDashboardScrollPersistence({
    storageKey: 'admin-dashboard-scroll',
    restoreWhen: !tab && !summaryLoading && !insightsLoading && !!summary && !!insights,
  })

  // Handle scroll position for pending-approvals section
  useEffect(() => {
    const scrollEl = document.getElementById("dashboard-scroll-root")
    if (!scrollEl) return

    const prevSection = prevSectionRef.current
    const currentSection = section ?? null

    // Save scroll ONLY when leaving pending-approvals
    if (prevSection === "pending-approvals") {
      scrollPositionsRef.current["pending-approvals"] = scrollEl.scrollTop
    }

    // Apply scroll for the new section
    requestAnimationFrame(() => {
      if (currentSection === "pending-approvals") {
        // Restore saved scroll
        const savedScroll = scrollPositionsRef.current["pending-approvals"]
        scrollEl.scrollTo({
          top: typeof savedScroll === "number" ? savedScroll : 0,
          left: 0,
          behavior: "instant",
        })
      } else {
        // ALL other sections start at top
        scrollEl.scrollTo({ top: 0, left: 0, behavior: "instant" })
      }
    })

    // Update previous section
    prevSectionRef.current = currentSection
  }, [section])

  // Handle navigation to tab (for DashboardContent)
  const handleNavigateToTab = useCallback((newTab: string) => {
    // Coming soon routes use query params (they don't have file-based pages yet)
    if (COMING_SOON_ROUTES.includes(newTab)) {
      router.push(`/admin-dashboard?tab=${newTab}`)
    } else {
      // All other routes use file-based routing: /admin-dashboard/{tab}
      router.push(`/admin-dashboard/${newTab}`)
    }
  }, [router])

  // Render content based on tab query param
  // This page only handles: dashboard home (no tab param) and coming soon routes
  // All other routes have their own file-based pages
  const renderContent = () => {
    // If no tab param, show dashboard home
    if (!tab) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardContent
            userType="admin"
            onSliderStateChange={setIsSliderOpen}
            onNavigateToTab={handleNavigateToTab}
            section={section}
            sectionId={sectionId}
            onSectionChange={onSectionChange}
          />
        </Suspense>
      )
    }

    // Coming soon routes (routes without file-based pages yet)
    const config = COMING_SOON_CONFIGS[tab] || {
      title: "Coming Soon",
      description: "This feature is under development and will be available soon.",
      icon: undefined,
    }
    return (
      <ComingSoonSection
        title={config.title}
        description={config.description}
        icon={config.icon}
      />
    )
  }

  return renderContent()
}
