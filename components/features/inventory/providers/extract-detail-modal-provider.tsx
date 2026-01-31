"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

import ExtractDetailModal from "@/components/features/inventory/components/extract-detail-modal"

interface ExtractDetailModalContextValue {
  openModal: () => void
  closeModal: () => void
  isProcessing: boolean
}

const ExtractDetailModalContext = createContext<ExtractDetailModalContextValue | undefined>(undefined)

export function ExtractDetailModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({
      openModal,
      closeModal,
      isProcessing,
    }),
    [openModal, closeModal, isProcessing]
  )

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        closeModal()
      } else {
        openModal()
      }
    },
    [openModal, closeModal]
  )

  return (
    <ExtractDetailModalContext.Provider value={value}>
      {children}
      <ExtractDetailModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        onProcessingChange={(processing) => setIsProcessing(processing)}
      />
    </ExtractDetailModalContext.Provider>
  )
}

export function useExtractDetailModal() {
  const context = useContext(ExtractDetailModalContext)
  if (!context) {
    throw new Error("useExtractDetailModal must be used within ExtractDetailModalProvider")
  }
  return context
}





