"use client"

import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface NotFoundIdRouteProps {
  pageTitle?: string
  title?: string
  message?: string
  backUrl?: string
  backLabel?: string
}

export function NotFoundIdRoute({
  pageTitle,
  title = "Not Found",
  message = "The item you're looking for doesn't exist or has been removed.",
  backUrl,
  backLabel = "Go Back"
}: NotFoundIdRouteProps) {
  const router = useRouter()

  const handleGoBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back()
    } else {
      // Fallback to home if no history
      window.location.href = "/"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={pageTitle || "Not Found"}
        subTitle={title}
        onTitleClick={handleGoBack}
      />
      <div className="m-[24px]">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
              <AlertCircle className="h-16 w-16 text-gray-400" />
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900 font-urbanist">
                  {title}
                </h2>
                <p className="text-base text-gray-600 font-urbanist max-w-md">
                  {message}
                </p>
              </div>
              <Button
                onClick={handleGoBack}
                className="mt-6 bg-secondary-900 hover:bg-secondary-800 text-white font-urbanist font-semibold"
              >
                {backLabel}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

