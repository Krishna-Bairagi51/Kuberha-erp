"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { useSearchParams } from "next/navigation"

interface SellerDashboardContextType {
  isSliderOpen: boolean
  setIsSliderOpen: (isOpen: boolean) => void
  // Section params for deep linking within a page (seller uses section-based routing for nested routes)
  section: string | null
  sectionId: string | null
  onSectionChange: (section: string | null, id?: string | number | null) => void
}

const SellerDashboardContext = createContext<SellerDashboardContextType | null>(null)

export function useSellerDashboard() {
  const context = useContext(SellerDashboardContext)
  if (!context) {
    throw new Error("useSellerDashboard must be used within SellerDashboardProvider")
  }
  return context
}

interface SellerDashboardProviderProps {
  children: ReactNode
}

export function SellerDashboardProvider({ children }: SellerDashboardProviderProps) {
  const [isSliderOpen, setIsSliderOpen] = useState(false)
  const searchParams = useSearchParams()
  
  // Get section params from URL
  const section = searchParams.get("section")
  const sectionId = searchParams.get("id")

  // Handle section changes within a page (e.g., inventory > edit > id)
  const onSectionChange = useCallback((newSection: string | null, id?: string | number | null) => {
    const url = new URL(window.location.href)

    if (newSection) {
      url.searchParams.set("section", newSection)
    } else {
      url.searchParams.delete("section")
    }

    if (id !== undefined && id !== null) {
      url.searchParams.set("id", String(id))
    } else {
      url.searchParams.delete("id")
    }

    window.history.pushState({}, "", url.toString())
  }, [])

  return (
    <SellerDashboardContext.Provider
      value={{
        isSliderOpen,
        setIsSliderOpen,
        section,
        sectionId,
        onSectionChange,
      }}
    >
      {children}
    </SellerDashboardContext.Provider>
  )
}
