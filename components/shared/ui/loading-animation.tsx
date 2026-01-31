"use client"

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import { motion, AnimatePresence } from 'framer-motion'

// Animation file paths
const animationPaths = [
  '/Loading-animation/carrying-wood.json',
  '/Loading-animation/wood-sawhorse.json',
  '/Loading-animation/woodcutter.json',
  '/Loading-animation/nail-fixing.json',
  '/Loading-animation/sandpaper.json',
  '/Loading-animation/wood-varnish.json',
  '/Loading-animation/polishing-furniture.json',
]

interface LoadingAnimationProps {
  className?: string
  size?: number
  loopDuration?: number // Duration each animation should play (in milliseconds)
}

export function LoadingAnimation({ 
  className = '', 
  size = 256,
  loopDuration = 3000 
}: LoadingAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animationData, setAnimationData] = useState<object | null>(null)

  // Load animation data when index changes
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch(animationPaths[currentIndex])
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.statusText}`)
        }
        const data = await response.json()
        setAnimationData(data)
      } catch (error) {
        console.error('Failed to load animation:', error)
        // Fallback: try to move to next animation if current one fails
        setCurrentIndex((prev) => (prev + 1) % animationPaths.length)
      }
    }
    
    loadAnimation()
  }, [currentIndex])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % animationPaths.length)
    }, loopDuration)

    return () => clearInterval(interval)
  }, [loopDuration])

  if (!animationData) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        role="status"
        aria-live="polite"
        aria-label="Loading animation"
      >
        <div style={{ width: size, height: size }} />
      </div>
    )
  }

  return (
    <div 
      className={`flex items-center justify-center relative ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading animation"
      style={{ width: size, height: size }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -10 }}
          transition={{ 
            duration: 0.6, 
            ease: [0.25, 0.1, 0.25, 1], // Smooth cubic-bezier easing
            opacity: { duration: 0.5 },
            scale: { duration: 0.6 },
            y: { duration: 0.6 }
          }}
          style={{ 
            width: size, 
            height: size,
            position: 'absolute',
            top: 0,
            left: 0
          }}
          className="flex items-center justify-center"
        >
          <Lottie
            animationData={animationData}
            loop={true}
            autoplay={true}
            style={{ width: size, height: size }}
          />
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">Loading</span>
    </div>
  )
}

