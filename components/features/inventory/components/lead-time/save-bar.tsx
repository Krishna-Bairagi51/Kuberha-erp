"use client"

import React from 'react'
import { Button } from '@/components/ui/button'

interface SaveBarProps {
  show: boolean
  hasAllRequiredRanges: boolean
  duplicateError?: string | null
  isSaving: boolean
  templateName: string
  hasDataChanged: boolean
  onSave: () => void
}

export const SaveBar: React.FC<SaveBarProps> = ({
  show,
  hasAllRequiredRanges,
  duplicateError,
  isSaving,
  templateName,
  hasDataChanged,
  onSave,
}) => {
  if (!show) return null

  return (
    <div className="flex items-center justify-end gap-2 mt-4">
      {!hasAllRequiredRanges && (
        <p className="text-xs text-red-600 body-3 font-urbanist">
          Please add all 4 required quantity ranges
        </p>
      )}
      {duplicateError && (
        <p className="text-xs text-red-600 body-3 font-urbanist">
          {duplicateError}
        </p>
      )}
      <Button
        type="button"
        onClick={onSave}
        disabled={
          isSaving || 
          !templateName || 
          !hasAllRequiredRanges || 
          !hasDataChanged
        }
        className={`h-9 px-4 body-3 font-urbanist text-sm ${
          !hasDataChanged
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-secondary-900 hover:bg-secondary-800 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isSaving ? 'Saving...' : hasDataChanged ? 'Save Template' : 'Saved'}
      </Button>
    </div>
  )
}

export default SaveBar

