"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NotFound() {
  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back()
    } else {
      // Fallback to home if no history
      window.location.href = "/"
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      {/* Full Screen Image */}
      <div className="relative w-full h-[50vh] max-h-[600px] flex items-center justify-center">
        <Image
          src="/images/original-aac8f7f838812fa53cd92617fad5f892.gif"
          alt="404 Not Found"
          fill
          className="object-contain"
          unoptimized
          priority
        />
      </div>

      {/* Text Content */}
      <div className="text-center space-y-4 max-w-xl w-full">
        <h1 className="text-6xl md:text-8xl font-bold text-black mb-2">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-black">
          Page Not Found
        </h2>
        <p className="text-base md:text-lg text-black">
          The page you're looking for doesn't exist.
        </p>

        {/* CTA Button */}
        <div className="flex justify-center items-center">
          <Button
            className="w-full sm:w-auto sm:min-w-[180px] bg-secondary-900 hover:bg-secondary-800 text-white h-12 text-base"
            onClick={handleGoBack}
            size="lg"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}