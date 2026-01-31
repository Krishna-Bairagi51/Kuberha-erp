import { useCallback, useEffect, useRef } from 'react'

type ScrollRootId = 'dashboard-scroll-root'

function getScrollRoot(id: ScrollRootId = 'dashboard-scroll-root'): HTMLElement | null {
  if (typeof window === 'undefined') return null
  return document.getElementById(id)
}

/**
 * Persist + restore scroll position for the dashboard scroll container (NOT window scroll).
 *
 * This matches your layout: `components/shared/layout/dashboard-layout.tsx`
 * where the scrollable element is `<main id="dashboard-scroll-root" className="overflow-auto">`.
 */
export function useDashboardScrollPersistence(options: {
  /** Unique key per page, e.g. "seller-inventory" */
  storageKey: string
  /** Only restore after this becomes true (e.g. data loaded) */
  restoreWhen?: boolean
}) {
  const { storageKey, restoreWhen = true } = options
  const restoredRef = useRef(false)

  const save = useCallback(() => {
    const root = getScrollRoot()
    if (!root) return
    try {
      sessionStorage.setItem(storageKey, String(root.scrollTop))
    } catch {
      // ignore
    }
  }, [storageKey])

  useEffect(() => {
    const root = getScrollRoot()
    if (!root) return

    // Debounced save while the user scrolls inside the dashboard container.
    let t: ReturnType<typeof setTimeout> | null = null
    const onScroll = () => {
      if (t) clearTimeout(t)
      t = setTimeout(save, 150)
    }

    root.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      root.removeEventListener('scroll', onScroll)
      if (t) clearTimeout(t)
    }
  }, [save])

  // Smooth scroll restoration: restore scroll position with smooth animation
  // This provides a pleasant user experience similar to modern websites
  useEffect(() => {
    if (!restoreWhen || restoredRef.current) return

    const root = getScrollRoot()
    if (!root) return

    let stored: string | null = null
    try {
      stored = sessionStorage.getItem(storageKey)
    } catch {
      stored = null
    }
    if (!stored) {
      restoredRef.current = true
      return
    }

    const target = Number(stored)
    if (!Number.isFinite(target) || target <= 0) {
      restoredRef.current = true
      return
    }

    // Wait a brief moment for content to render, then smoothly scroll to saved position
    const t = setTimeout(() => {
      // Enable smooth scrolling behavior
      root.style.scrollBehavior = 'smooth'
      
      // Smoothly scroll to the saved position
      // Using scrollTop with smooth behavior for maximum browser compatibility
      if (typeof root.scrollTo === 'function') {
        // Modern browsers support scrollTo with options
        root.scrollTo({
          top: target,
          behavior: 'smooth'
        })
      } else {
        // Fallback for older browsers: set scrollTop directly
        // The smooth behavior is already set via CSS
        root.scrollTop = target
      }

      // Mark as restored and clean up after animation completes
      // Smooth scroll typically takes 300-500ms, so we wait a bit longer
      const cleanupDelay = 600
      setTimeout(() => {
        restoredRef.current = true
        try {
          sessionStorage.removeItem(storageKey)
        } catch {
          // ignore
        }
        // Reset scroll behavior to default after animation
        root.style.scrollBehavior = ''
      }, cleanupDelay)
    }, 100) // Small delay to ensure content is rendered

    return () => clearTimeout(t)
  }, [restoreWhen, storageKey])

  return { save }
}

