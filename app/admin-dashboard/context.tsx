"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { usePathname, useSearchParams } from "next/navigation"

interface AdminDashboardContextType {
  isSliderOpen: boolean
  setIsSliderOpen: (isOpen: boolean) => void
  // Section params for deep linking within a page
  section: string | null
  sectionId: string | null
  onSectionChange: (section: string | null, id?: string | number | null) => void
}

const AdminDashboardContext = createContext<AdminDashboardContextType | null>(null)

export function useAdminDashboard() {
  const context = useContext(AdminDashboardContext)
  if (!context) {
    throw new Error("useAdminDashboard must be used within AdminDashboardProvider")
  }
  return context
}

interface AdminDashboardProviderProps {
  children: ReactNode
}

export function AdminDashboardProvider({ children }: AdminDashboardProviderProps) {
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
    <AdminDashboardContext.Provider
      value={{
        isSliderOpen,
        setIsSliderOpen,
        section,
        sectionId,
        onSectionChange,
      }}
    >
      {children}
    </AdminDashboardContext.Provider>
  )
}
