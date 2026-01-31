"use client"

import type React from "react"

import "./kuberbot-icon.css"
import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"

export default function KuberBotIcon() {
  const [bottom, setBottom] = useState(24)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setBottom((prevBottom) => {
        const newBottom = prevBottom - e.movementY
        // Restrict within viewport (min 24px from bottom, max leaving 80px at top)
        return Math.max(24, Math.min(window.innerHeight - 80, newBottom))
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Attach and detach event listeners for mouse move and up
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    } else {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  return (
    <div
      className="kuberbot-container"
      style={{ bottom: `${bottom}px`, cursor: isDragging ? "grabbing" : "grab" }}
      onMouseDown={handleMouseDown}
    >
      {/* Rotating silver border */}
      <div className="kuberbot-border"></div>

      {/* Main icon */}
      <div className="kuberbot-icon group flex items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 transition-transform duration-500 group-hover:scale-110" />
        <Sparkles className="relative z-10 w-8 h-8 text-white drop-shadow-md animate-pulse" />
      </div>
    </div>
  )
}
