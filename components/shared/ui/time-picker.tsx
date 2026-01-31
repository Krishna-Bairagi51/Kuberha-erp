"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, CalendarDays, ChevronDown, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarModal } from "@/components/ui/calendar-modal"
import { cn } from "@/lib/utils"

export type TimePeriod = "today" | "week" | "month" | "custom"

interface TimePickerProps {
  selectedPeriod: TimePeriod
  onPeriodChange: (period: TimePeriod, customDates?: { startDate: string; endDate: string }) => void
  isLoading?: boolean
  className?: string
}

function formatDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[date.getMonth()]} ${date.getDate()}`
}

function formatDateForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function TimePicker({ 
  selectedPeriod, 
  onPeriodChange, 
  isLoading = false,
  className = ""
}: TimePickerProps) {
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [dateError, setDateError] = useState<string>("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const periods = [
    { id: "today", label: "Today", icon: Calendar },
    { id: "week", label: "This Week", icon: CalendarDays },
    { id: "month", label: "This Month", icon: Calendar },
    { id: "custom", label: "Custom Range", icon: CalendarDays },
  ]

  // Reset custom dates when switching away from custom period
  useEffect(() => {
    if (selectedPeriod !== "custom") {
      setCustomStartDate(undefined)
      setCustomEndDate(undefined)
      setDateError("")
    }
  }, [selectedPeriod])

  const handlePeriodClick = (period: TimePeriod) => {
    if (period === "custom") {
      setIsCustomOpen(true)
      setIsDropdownOpen(false)
    } else {
      onPeriodChange(period)
      setIsDropdownOpen(false)
    }
  }

  const handleStartDateChange = (date: Date | undefined) => {
    setCustomStartDate(date)
    setDateError("")
    
    // If end date exists and is before start date, clear it
    if (date && customEndDate && date > customEndDate) {
      setCustomEndDate(undefined)
    }
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setCustomEndDate(date)
    setDateError("")
    
    // Validate that end date is not before start date
    if (date && customStartDate && date < customStartDate) {
      setDateError("End date cannot be before start date")
    }
  }

  const validateCustomDates = (): boolean => {
    if (!customStartDate || !customEndDate) {
      setDateError("Please select both start and end dates")
      return false
    }
    
    if (customStartDate > customEndDate) {
      setDateError("Start date cannot be after end date")
      return false
    }
    
    setDateError("")
    return true
  }

  const handleCustomDateApply = async () => {
    if (!validateCustomDates()) return
    
    setIsApplying(true)
    try {
      const customDates = {
        startDate: formatDateForAPI(customStartDate!),
        endDate: formatDateForAPI(customEndDate!),
      }
      await onPeriodChange("custom", customDates)
      setIsCustomOpen(false)
    } catch (error) {
    } finally {
      setIsApplying(false)
    }
  }

  const handleCustomDateCancel = () => {
    setCustomStartDate(undefined)
    setCustomEndDate(undefined)
    setDateError("")
    setIsCustomOpen(false)
  }

  const getDisplayText = () => {
    if (selectedPeriod === "custom" && customStartDate && customEndDate) {
      return `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`
    }
    return periods.find((p) => p.id === selectedPeriod)?.label || "Today"
  }

  const getDisplayIcon = () => {
    const period = periods.find((p) => p.id === selectedPeriod)
    return period?.icon || Calendar
  }

  const isApplyDisabled = !customStartDate || !customEndDate || !!dateError || isApplying
  const DisplayIcon = getDisplayIcon()

  return (
    <div className={cn("relative", className)}>
      {/* Main Dropdown Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none bg-white hover:bg-gray-50 transition-colors duration-200 min-w-[160px] justify-between",
          {
            "opacity-50 cursor-not-allowed": isLoading
          }
        )}
      >
        <div className="flex items-center gap-2">
          <DisplayIcon className="h-4 w-4 text-gray-400" />
          <span className="font-semibold text-gray-700">{getDisplayText()}</span>
        </div>
        <div className="flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", {
            "rotate-180": isDropdownOpen
          })} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[160px] bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {periods.map((period) => {
              const IconComponent = period.icon
              const isSelected = selectedPeriod === period.id
              
              return (
                <button
                  key={period.id}
                  onClick={() => handlePeriodClick(period.id as TimePeriod)}
                  disabled={isLoading}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors duration-200 min-h-[40px]",
                    {
                      "bg-secondary-900 text-white hover:bg-secondary-900": isSelected,
                      "text-gray-700": !isSelected,
                      "opacity-50 cursor-not-allowed": isLoading
                    }
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="font-medium">{period.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Custom Date Range Dialog */}
      <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-secondary-900" />
              <span>Select Custom Date Range</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <CalendarModal
                  value={customStartDate}
                  onSelect={handleStartDateChange}
                  placeholder="Select start date"
                  maxDate={customEndDate || new Date()}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  End Date
                </label>
                <CalendarModal
                  value={customEndDate}
                  onSelect={handleEndDateChange}
                  placeholder="Select end date"
                  minDate={customStartDate}
                  maxDate={new Date()}
                  className="w-full"
                />
              </div>
            </div>
            
            {dateError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-medium">{dateError}</p>
              </div>
            )}
            
            {customStartDate && customEndDate && !dateError && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600 font-medium">
                  Selected range: {formatDate(customStartDate)} - {formatDate(customEndDate)}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 ">
            <Button
              variant="outline"
              onClick={handleCustomDateCancel}
              disabled={isApplying}
              className="px-6 py-2 bg-white text-secondary-900 hover:text-secondary-900 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomDateApply}
              disabled={isApplyDisabled}
              className="px-6 py-2 bg-secondary-900 text-white hover:bg-secondary-800"
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Applying...
                </>
              ) : (
                "Apply Range"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Backdrop to close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}


