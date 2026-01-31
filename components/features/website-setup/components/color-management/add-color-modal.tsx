"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddColorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: { name: string; hex: string }) => void | Promise<void>
}

const DEFAULT_PREVIEW = "#FFFFFF"

function AddColorModal({ open, onOpenChange, onSubmit }: AddColorModalProps) {
  const [name, setName] = useState("")
  const [hex, setHex] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizedHex = hex.startsWith("#") ? hex : hex ? `#${hex}` : ""
  const isHexValid = /^#?[0-9A-Fa-f]{6}$/.test(hex) || /^#[0-9A-Fa-f]{6}$/.test(normalizedHex)
  const previewColor = isHexValid ? normalizedHex.replace(/^#/, "#") : DEFAULT_PREVIEW
  const displayHex = hex ? (hex.startsWith("#") ? hex : `#${hex}`) : "#XXXXXX"

  // Validate that name doesn't start with a minus sign
  const isNameValid = name.trim().length > 0 && !name.trim().startsWith("-")
  const nameError = name.trim().length > 0 && name.trim().startsWith("-") 
    ? "Color name cannot start with a minus sign (e.g., '-3' or '-white'). Use format like '4-3' or 'white-4' instead."
    : ""

  const isValid = isNameValid && isHexValid

  const handleNameChange = (value: string) => {
    // Prevent name from starting with a minus sign
    // Allow minus signs in the middle (e.g., "4-3", "white-4")
    if (value.startsWith("-")) {
      // Remove the leading minus sign
      setName(value.replace(/^-/, ''))
    } else {
      setName(value)
    }
  }

  const handleSubmit = async () => {
    if (!isValid) return
    try {
      setIsSubmitting(true)
      if (onSubmit) {
        await onSubmit({
          name: name.trim(),
          hex: normalizedHex.replace(/^#?/, "#"),
        })
        // Only close and reset if onSubmit succeeds (doesn't throw)
        onOpenChange(false)
        setName("")
        setHex("")
      }
    } catch (error) {
      // Error is handled by parent component, just re-throw to prevent modal close
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-gray-900">Add New Color</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-500">
            Create a new color with its hex code and assign it to a category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Color Name *</label>
            <Input
              placeholder="Enter color name (e.g., '4-3' or 'white-4')"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`h-11 sm:h-12 ${nameError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
            />
            {nameError && (
              <p className="text-xs text-red-600 mt-1">{nameError}</p>
            )}
            {!nameError && name.trim().length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Color name cannot start with a minus sign</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-800">Hex Code *</label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter hex code such as #FF5733"
                  value={hex}
                  onChange={(e) => setHex(e.target.value.trim())}
                  className="h-11 sm:h-12"
                />
                <p className="mt-1 text-xs text-gray-500">Enter a valid hex color code with or without #</p>
              </div>
            </div>
          </div>
          {hex.trim().length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
              <div className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Preview</div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl border border-gray-200 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: previewColor }}
                />
                <div className="space-y-1">
                  <div className="text-lg sm:text-xl font-semibold text-gray-900">
                    {name.trim() || "Color Name"}
                  </div>
                  <div className="text-sm sm:text-base font-semibold text-gray-600">
                    {displayHex}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6 w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="h-11 px-6 bg-secondary-900 hover:bg-secondary-800 text-white w-full sm:w-auto"
          >
            Add Color
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddColorModal