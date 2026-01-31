"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { LoadingSpinner } from "@/components/shared/ui/loading-spinner"

// Lazy load the ChatFullscreen component for code splitting
const ChatFullscreen = dynamic(
  () => import("@/components/features/chat").then((mod) => ({ default: mod.ChatFullscreen })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export default function SellerAskKuberhaAIPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ChatFullscreen />
    </Suspense>
  )
}
