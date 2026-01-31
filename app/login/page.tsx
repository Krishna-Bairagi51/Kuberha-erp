"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { OTPLoginForm } from "@/app/login/otp-login-form"
import RightSide from "./right-side"
import { getAccessToken, getUserType, isStoredAuthenticated } from "@/lib/services/storage.service"

/**
 * Login Page
 * 
 * Optimized with TanStack Query:
 * - Mutations handle all auth persistence and redirects
 * - No manual localStorage manipulation needed
 * - Fast redirects using Next.js router (no page reload)
 */
export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

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
    <div className="min-h-screen flex flex-col md:flex-row p-2 sm:p-4">
      {/* Left Side - Form */}
      <div className="w-full md:w-[50%] flex items-center justify-center bg-white md:mr-4 py-4 sm:py-6 md:py-0">
        {/* 
          onSuccess is now optional - mutations handle all auth logic:
          - Persisting to localStorage
          - Cache invalidation  
          - Cross-tab sync
          - Redirect navigation
        */}
        <OTPLoginForm />
      </div>

      {/* Right Side - Image + Text */}
      <div className="hidden md:flex w-[50%] items-center justify-center bg-gray-50 relative z-10">
        <RightSide />
      </div>

      <div className="fixed bg-red-700 opacity-50 blur-3xl w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] bottom-0 right-0 z-0 pointer-events-none"></div>
    </div>
  )
}
