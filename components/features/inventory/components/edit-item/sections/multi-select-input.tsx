"use client"

import React, { useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import type { EditInventoryFormValues } from '../schemas/edit-inventory-form.schema'

interface MultiSelectInputProps {
  label: string
  placeholder: string
  data?: Array<{ id: number; name: string }>
  name: keyof EditInventoryFormValues
  required?: boolean
  validateValue?: (value: string) => string | undefined
  getHighlightStyles?: (fieldKey: string, baseClassName: string) => string
  highlightField?: string
}

const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
  label,
  placeholder,
  data,
  name,
  required = false,
  validateValue,
  getHighlightStyles,
  highlightField,
}) => {
  const { control, formState: { errors }, clearErrors } = useFormContext<EditInventoryFormValues>()
  const [isOpen, setIsOpen] = useState(false)
  const [localValue, setLocalValue] = useState('')

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const values = (field.value || []) as string[]
        const error = errors[name]?.message as string | undefined

        const filteredData =
          data?.filter(
            (item) =>
              item.name.toLowerCase().includes(localValue.toLowerCase()) &&
              !values.includes(item.name)
          ) || []

        const handleSelect = (value: string, skipValidation: boolean = false) => {
          const normalizedValue = value.trim()
          if (!normalizedValue) return

          // Only validate if it's a manually entered value (not from existing data list)
          if (!skipValidation) {
            const validationMessage = validateValue?.(normalizedValue)
            if (validationMessage) {
              // This error will be handled by Zod schema now
              return
            }
          }

          // Clear error immediately when selecting a valid value
          clearErrors(name)

          if (!values.includes(normalizedValue)) {
            field.onChange([...values, normalizedValue])
          }

          setLocalValue('')
          setIsOpen(false)
        }

        const handleRemove = (valueToRemove: string) => {
          field.onChange(values.filter((v) => v !== valueToRemove))
        }

        const handleInputChangeLocal = (value: string) => {
          setLocalValue(value)
          // Clear error when user starts typing again (gives them a fresh start)
          if (error) {
            clearErrors(name)
          }
          if (value.length > 0) {
            setIsOpen(true)
          } else {
            setIsOpen(false)
          }
        }

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' && localValue.trim() && filteredData.length === 0) {
            e.preventDefault()
            handleSelect(localValue.trim())
          }
        }

        const baseClassName = `h-9 body-3 font-urbanist text-sm text-neutral-900 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}`
        const inputClassName = highlightField && getHighlightStyles
          ? getHighlightStyles(highlightField, baseClassName)
          : baseClassName

        return (
          <div className="space-y-1">
            <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
              {label} {required && '*'}
            </Label>
            <div className="relative">
              <Input
                type="text"
                value={localValue}
                onChange={(e) => handleInputChangeLocal(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                onFocus={() => {
                  if (localValue.length > 0) {
                    setIsOpen(true)
                  }
                }}
                placeholder={placeholder}
                className={inputClassName}
              />

              {isOpen && filteredData.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredData.map((item) => (
                    <div
                      key={item.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onMouseDown={() => handleSelect(item.name, true)}
                    >
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {isOpen && localValue.trim() && filteredData.length === 0 && !validateValue?.(localValue.trim()) && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  <div className="px-3 py-2 text-sm text-gray-500 italic">
                    Press Enter to add "{localValue}"
                  </div>
                </div>
              )}
            </div>

            {values.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {values.map((value, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-secondary-100 text-secondary-900 hover:bg-secondary-200 px-2 py-1 text-xs flex items-center gap-1"
                  >
                    {value}
                    <button
                      type="button"
                      onClick={() => handleRemove(value)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        )
      }}
    />
  )
}

export default MultiSelectInput
