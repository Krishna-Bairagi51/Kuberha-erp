"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

type LoadingSpinnerProps = {
  size?: number
  className?: string
}

export function LoadingSpinner({ size = 70, className }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("grid min-h-screen w-full place-items-center", className)}
    >
      <div
        className="relative transform-gpu animate-[stoolSpinPulse_2.4s_ease-in-out_infinite] origin-center"
        style={{ width: size, height: size }}
      >
        <Image
          src="/stool.svg"
          alt="Loading stool"
          width={size}
          height={size}
          priority
          className="h-full w-full select-none"
        />
      </div>

      <span className="sr-only">Loading</span>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes stoolSpinPulse {
              0% { transform: scale(1) rotate(0deg); }
              22% { transform: scale(1.08) rotate(0deg); }
              55% { transform: scale(1.14) rotate(180deg); }
              78% { transform: scale(1.14) rotate(360deg); }
              92% { transform: scale(1.02) rotate(360deg); }
              100% { transform: scale(1) rotate(360deg); }
            }
          `,
        }}
      />
    </div>
  )
}


