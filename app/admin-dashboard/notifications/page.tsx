"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"

// Lazy load the NotificationSection component for code splitting
const NotificationSection = dynamic(
  () => import("@/components/notification/components/notification-section"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NotificationSection />
    </Suspense>
  )
}
