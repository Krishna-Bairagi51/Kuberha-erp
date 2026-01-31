"use client"

import * as React from "react"
import { Calendar, ChevronLeft, ChevronRight, CalendarDays, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ArrowLeftIcon } from "lucide-react"

interface CalendarModalProps {
  value?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export const CalendarModal: React.FC<CalendarModalProps> = ({
  value,
  onSelect,
  placeholder = "Select date",
  className,
  disabled = false,
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(
    value ? value.getMonth() : new Date().getMonth()
  )
  const [currentYear, setCurrentYear] = React.useState(
    value ? value.getFullYear() : new Date().getFullYear()
  )
  const [showMonthYearPicker, setShowMonthYearPicker] = React.useState(false)

  const formatDate = (date: Date | undefined): string => {
    if (!date) return ""
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = String(date.getFullYear())
    return `${dd}/${mm}/${yyyy}`
  }

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number): number => {
    return new Date(year, month, 1).getDay()
  }

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    
    // Prevent future dates (dates after today)
    const today = new Date()
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (dateOnly > todayDateOnly) return true
    
    return false
  }

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentYear, currentMonth, day)
    if (isDateDisabled(selectedDate)) return
    
    onSelect?.(selectedDate)
    setIsOpen(false)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
    handleDateSelect(today.getDate())
  }

  const handleMonthYearChange = (month: number, year: number) => {
    setCurrentMonth(month)
    setCurrentYear(year)
    setShowMonthYearPicker(false)
  }

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const startYear = 1900
    const endYear = currentYear // Only allow up to current year, no future years
    const years = []
    
    for (let year = endYear; year >= startYear; year--) {
      years.push(year)
    }
    
    return years
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const today = new Date()
    
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 w-10"></div>
      )
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const isSelected = value ? isSameDay(date, value) : false
      const isToday = isSameDay(date, today)
      const isDisabled = isDateDisabled(date)
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          disabled={isDisabled}
          className={cn(
            "h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200",
            "hover:bg-gray-100 hover:text-gray-700 hover:scale-105",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            "active:scale-95",
            {
              "bg-secondary-900 text-white hover:bg-secondary-800 shadow-md": isSelected,
              "bg-gray-100 text-gray-700 font-semibold": isToday && !isSelected,
              "text-gray-400 cursor-not-allowed opacity-50 hover:bg-transparent hover:scale-100": isDisabled,
              "text-gray-700 hover:shadow-sm": !isSelected && !isToday && !isDisabled
            }
          )}
        >
          {day}
        </button>
      )
    }
    
    return days
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative">
          <Input
            value={formatDate(value)}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            className={cn(
              "cursor-pointer pr-10 border-gray-300 transition-colors",
              "hover:border-gray-400",
              className
            )}
            onClick={() => !disabled && setIsOpen(true)}
          />
          <CalendarDays className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </DialogTrigger>
      
      <DialogContent className="w-auto p-0 max-w-md">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-center text-xl font-semibold text-gray-700">Select Date</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 pt-0">
          {!showMonthYearPicker ? (
            <>
              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="h-9 w-9 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-400" />
                </button>
                
                <button
                  onClick={() => setShowMonthYearPicker(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors bg-white"
                >
                  <span className="text-lg font-semibold text-gray-700">
                    {MONTHS[currentMonth]} {currentYear}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                <button
                  onClick={() => navigateMonth("next")}
                  className="h-9 w-9 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Month/Year Picker */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4 space-x-4">
                  <h3 className="text-lg font-semibold text-gray-700">Select Month & Year</h3>
                  <button
                    onClick={() => setShowMonthYearPicker(false)}
                    className="text-sm px-3 py-1.5 ml-auto border border-gray-300 rounded hover:bg-gray-50 transition-colors text-gray-700 bg-secondary-900 text-white hover:bg-secondary-800"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowLeftIcon className="h-4 w-4 text-white" />
                      Back
                    </span>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Month</label>
                    <Select
                      value={currentMonth.toString()}
                      onValueChange={(value) => setCurrentMonth(parseInt(value))}
                    >
                      <SelectTrigger className="w-full border-gray-300 hover:border-gray-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-40 border-gray-300">
                        {MONTHS.map((month, index) => (
                          <SelectItem 
                            key={index} 
                            value={index.toString()}
                            className="hover:bg-secondary-900 hover:text-white focus:bg-secondary-900 text-secondary-900"
                          >
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Year</label>
                    <Select
                      value={currentYear.toString()}
                      onValueChange={(value) => setCurrentYear(parseInt(value))}
                    >
                      <SelectTrigger className="w-full border-gray-300 hover:border-gray-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-40 border-gray-300">
                        {generateYearOptions().map((year) => (
                          <SelectItem 
                            key={year} 
                            value={year.toString()}
                            className="hover:bg-secondary-900 hover:text-white focus:bg-secondary-900 text-secondary-900"
                          >
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <button
                    onClick={() => setShowMonthYearPicker(false)}
                    className="w-full mt-4 bg-secondary-900 hover:bg-secondary-800 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
          
          {!showMonthYearPicker && (
            <>
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="h-10 w-10 text-xs font-medium text-gray-400 flex items-center justify-center"
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {renderCalendarDays()}
              </div>
              
              {/* Action buttons */}
              {/* <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Today
                </Button>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Button>
                  {value && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onSelect?.(undefined)
                        setIsOpen(false)
                      }}
                      className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div> */}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
