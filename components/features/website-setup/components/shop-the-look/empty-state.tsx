"use client"

import { Image as ImageIcon } from "lucide-react"

interface EmptyStateProps {
  
  searchTerm?: string
}

export function EmptyState({ searchTerm }: EmptyStateProps) {
  if (searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="mb-6">
          <ImageIcon className="h-24 w-24 text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No looks found
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-md">
          No looks match "{searchTerm}"
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="mb-6">
        <ImageIcon className="h-24 w-24 text-gray-300" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        No looks yet
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-md">
        Create your first look to get started
      </p>
    </div>
  )
}

