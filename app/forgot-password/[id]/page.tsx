"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { LeftPage } from "@/app/forgot-password/left-page"
import RightSide from "@/app/login/right-side"
import { getAccessToken, getUserType, isStoredAuthenticated } from "@/lib/services/storage.service"

/**
 * Forgot Password Page
 * 
 * Simple password reset form with password and confirm password fields
 */
export default function ForgotPasswordPage() {
  const router = useRouter()
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  // Get token from URL parameter
  const token = params?.id as string | undefined

  // Check if already authenticated on mount - redirect immediately if so
  useEffect(() => {
    setMounted(true)
    
    if (typeof window === "undefined") return

    // Quick sync check - no async needed for localStorage
    const isAuthenticated = isStoredAuthenticated()
    const accessToken = getAccessToken()
    const userType = getUserType()
    const sellerState = localStorage.getItem("seller_state")

    if (isAuthenticated && accessToken) {
      setIsRedirecting(true)
      
      // Use Next.js router for instant navigation without page reload
      if (userType === "admin") {
        router.replace("/admin-dashboard")
      } else if (userType === "seller") {
        if (sellerState === "approved") {
          router.replace("/seller-dashboard")
        } else {
          router.replace("/partner-onboarding")
        }
      }
    }
  }, [router])

  // Show nothing while redirecting to avoid flash
  if (!mounted || isRedirecting) {
    return null
  }

  return (
    <div className="min-h-screen flex p-4">
      {/* Left Side - Form */}
      <div className="w-full md:w-[50%] flex items-center justify-center bg-white mr-4">
        <LeftPage token={token} />
      </div>

      {/* Right Side - Image + Text */}
      <div className="hidden md:flex w-[50%] items-center justify-center bg-gray-50 relative z-10">
        <RightSide />
      </div>

      <div className="fixed bg-red-700 opacity-50 blur-3xl w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] bottom-0 right-0 z-0 pointer-events-none"></div>
    </div>
  )
}
