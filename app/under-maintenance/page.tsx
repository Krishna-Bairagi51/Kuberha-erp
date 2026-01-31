"use client"

import Image from "next/image"
import { Wrench, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function UnderMaintenancePage() {
  const [timeLeft, setTimeLeft] = useState(2 * 60 * 60) // 2 hours in seconds

  useEffect(() => {
    // Get the last reset time from localStorage or set it to now
    const getLastResetTime = () => {
      const stored = localStorage.getItem('maintenanceTimerReset')
      if (stored) {
        const lastReset = parseInt(stored)
        const now = Date.now()
        const elapsed = Math.floor((now - lastReset) / 1000) // elapsed seconds
        
        // If 2 hours have passed, reset the timer
        if (elapsed >= 2 * 60 * 60) {
          localStorage.setItem('maintenanceTimerReset', now.toString())
          return 2 * 60 * 60
        }
        
        // Otherwise, return remaining time
        return Math.max(0, 2 * 60 * 60 - elapsed)
      } else {
        localStorage.setItem('maintenanceTimerReset', Date.now().toString())
        return 2 * 60 * 60
      }
    }

    setTimeLeft(getLastResetTime())

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Reset timer when it reaches 0
          localStorage.setItem('maintenanceTimerReset', Date.now().toString())
          return 2 * 60 * 60
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0'),
    }
  }

  const { hours, minutes, seconds } = formatTime(timeLeft)

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large soft gradient shapes */}
        <div 
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #F0C7B9 0%, transparent 70%)" }}
        />
        <div 
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #ABF2FF 0%, transparent 70%)" }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #E18E73 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative w-full">
            <Image
              src="/images/Logo_Casa Carigar_TERRACOTTA 1.png"
              alt="Casa Carigar Logo"
              width={500}
              height={500}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-1000 text-center font-urbanist tracking-tight">
          We&apos;ll Be Back Soon
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg md:text-xl text-neutral-700 text-center max-w-2xl font-urbanist leading-relaxed">
          Casa Carigar is down for scheduled maintenance.
        </p>

        {/* Countdown Timer */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-neutral-600 mb-4">
            <Clock className="w-5 h-5 text-primary-600" />
            <span className="text-sm sm:text-base font-medium font-urbanist">Estimated time remaining</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Hours */}
            <div className="flex flex-col items-center text-primary-700 rounded-xl p-4 sm:p-6 shadow-lg border-2 border-primary-900 min-w-[80px] sm:min-w-[100px]">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-700 font-urbanist">
                {hours}
              </div>
              <div className="text-xs sm:text-sm text-primary-900 font-medium font-urbanist mt-1">
                Hours
              </div>
            </div>
            
            {/* Separator */}
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-600 font-urbanist">
              :
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center text-secondary-700 rounded-xl p-4 sm:p-6 shadow-lg border-2 border-secondary-900 min-w-[80px] sm:min-w-[100px]">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-secondary-900 font-urbanist">
                {minutes}
              </div>
              <div className="text-xs sm:text-sm text-secondary-900 font-medium font-urbanist mt-1">
                Minutes
              </div>
            </div>

            {/* Separator */}
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-600 font-urbanist">
              :
            </div>

            {/* Seconds */}
            <div className="flex flex-col items-center text-primary-700 rounded-xl p-4 sm:p-6 shadow-lg border-2 border-primary-900 min-w-[80px] sm:min-w-[100px]">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-700 font-urbanist">
                {seconds}
              </div>
              <div className="text-xs sm:text-sm text-primary-900 font-medium font-urbanist mt-1">
                Seconds
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Illustration Section */}
        <div className="relative w-full max-w-2xl flex items-center justify-center">
          {/* Abstract shapes and laptop illustration */}
          <div className="relative w-full h-full">
            {/* Background organic shapes */}
            <div 
              className="absolute top-10 left-10 w-64 h-64 rounded-full opacity-30 blur-2xl"
              style={{ background: "radial-gradient(circle, #F0C7B9 0%, transparent 70%)" }}
            />
            <div 
              className="absolute bottom-10 right-10 w-72 h-72 rounded-full opacity-30 blur-2xl"
              style={{ background: "radial-gradient(circle, #ABF2FF 0%, transparent 70%)" }}
            />
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <p className="text-sm sm:text-base text-neutral-600 font-urbanist">
            In the meantime, check out our platform to discover
            <br className="hidden sm:block" />
            high-quality furniture and home decor solutions.
          </p>
        </div>
      </div>
    </div>
  )
}