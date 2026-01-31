"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Rocket, Bell } from "lucide-react"

interface ComingSoonSectionProps {
  title: string
  description: string
  icon?: React.ReactNode
}

export function ComingSoonSection({ title, description, icon }: ComingSoonSectionProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="border-gray-200 max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">{icon || <Clock className="h-16 w-16 text-indigo-700" />}</div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
          <p className="text-gray-600 mb-6">{description}</p>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Rocket className="h-4 w-4" />
              <span>We're working hard to bring this feature to you</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}