"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CircleX, Trash2, Factory, Clock, Plus, Save, Check, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { leadTimeService } from '@/components/features/inventory/services/lead-time.service'
import type { LeadTimeEntry } from '../types/inventory.types'
import { 
  validateLeadTimes,
  getQuantityRangeString,
  getQuantityRangeSortOrder,
  sortLeadTimes,
  REQUIRED_QUANTITY_RANGES,
} from './lead-time/utils'
import TemplateGrid, { LeadTimeTemplateCard } from './lead-time/template-grid'
import LeadTimeForm from './lead-time/lead-time-form'
import LeadTimeTable from './lead-time/lead-time-table'
import SaveBar from './lead-time/save-bar'
import { useLeadTimeTemplatesQuery } from '../hooks/use-inventory-query'

interface ApiLeadTimeTemplate {
  id: number
  name: string
  manufacture_lead_time: Array<{
    start_qty: number
    end_qty: number
    lead_time: number
    lead_time_unit: string
  }>
}

interface ApiLeadTimeResponse {
  status_code: number
  record: ApiLeadTimeTemplate[]
}

type LeadTimeTemplate = LeadTimeTemplateCard

interface LeadTimeManagementProps {
  quantity_range: string
  lead_time_value: number
  lead_time_unit: string
  manufacture_lead_times: LeadTimeEntry[]
  leadTimeName?: string
  errors?: {
    quantity_range?: string
    lead_time_value?: string
    manufacture_lead_times?: string
    leadTimeName?: string
  }
  onQuantityRangeChange: (value: string) => void
  onLeadTimeValueChange: (value: string) => void
  onLeadTimeUnitChange: (value: string) => void
  onLeadTimeNameChange?: (value: string) => void
  onAddLeadTime: () => void
  onRemoveLeadTime: (index: number) => void
  onUpdateLeadTime: (index: number, lead_time_value: number, lead_time_unit: string) => void
  onApplyTemplate?: (leadTimes: LeadTimeEntry[]) => void
  required?: boolean
  showImportExport?: boolean
}

export const LeadTimeManagement = ({
  quantity_range,
  lead_time_value,
  lead_time_unit,
  manufacture_lead_times,
  leadTimeName = '',
  errors = {},
  onQuantityRangeChange,
  onLeadTimeValueChange,
  onLeadTimeUnitChange,
  onLeadTimeNameChange,
  onAddLeadTime,
  onRemoveLeadTime,
  onUpdateLeadTime,
  onApplyTemplate,
  required = false,
  showImportExport = false
}: LeadTimeManagementProps) => {
  const [customTemplates, setCustomTemplates] = useState<LeadTimeTemplate[]>([])
  const [showCustomTable, setShowCustomTable] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [templatesError, setTemplatesError] = useState<string | null>(null)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [localTemplateName, setLocalTemplateName] = useState(leadTimeName || '')
  const [duplicateError, setDuplicateError] = useState<string | null>(null)
  const [lastUsedTemplateId, setLastUsedTemplateId] = useState<string | null>(null)
  const [savedTemplateData, setSavedTemplateData] = useState<{
    name: string
    leadTimes: LeadTimeEntry[]
  } | null>(null)
  const [newlySavedTemplateName, setNewlySavedTemplateName] = useState<string | null>(null)
  const [appliedTemplateName, setAppliedTemplateName] = useState<string | null>(null)
  const [isLoadedViaAddEdit, setIsLoadedViaAddEdit] = useState(false)

  // Sync local state with prop value
  React.useEffect(() => {
    setLocalTemplateName(leadTimeName || '')
  }, [leadTimeName])

  // Clear duplicate error when lead times change
  React.useEffect(() => {
    if (duplicateError) {
      setDuplicateError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacture_lead_times])

  // Check if all required quantity ranges are present
  const hasAllRequiredRanges = (): boolean => {
    const presentRanges = manufacture_lead_times.map(lt => lt.quantity_range)
    return REQUIRED_QUANTITY_RANGES.every(range => presentRanges.includes(range))
  }

  // Function to transform API response to LeadTimeTemplate format
  const transformApiTemplateToLeadTimeTemplate = (apiTemplate: ApiLeadTimeTemplate): LeadTimeTemplate => {
    const leadTimes: LeadTimeEntry[] = apiTemplate.manufacture_lead_time.map(lt => ({
      quantity_range: getQuantityRangeString(lt.start_qty, lt.end_qty),
      lead_time_value: lt.lead_time,
      lead_time_unit: lt.lead_time_unit,
      start_qty: lt.start_qty,
      end_qty: lt.end_qty
    }))

    return {
      id: apiTemplate.id.toString(),
      name: apiTemplate.name,
      isCustom: false,
      leadTimes
    }
  }

  // Fetch templates via cached TanStack Query
  const {
    data: templatesResponse,
    isLoading: isLoadingTemplatesQuery,
    error: templatesQueryError,
    refetch: refetchTemplates,
  } = useLeadTimeTemplatesQuery()

  // Sync query loading state into local state for existing UI
  useEffect(() => {
    setIsLoadingTemplates(isLoadingTemplatesQuery)
  }, [isLoadingTemplatesQuery])

  // Handle query errors
  useEffect(() => {
    if (templatesQueryError) {
      const message = templatesQueryError instanceof Error ? templatesQueryError.message : 'Failed to load lead time templates'
      setTemplatesError(message)
      toast.error(message)
      } else {
      setTemplatesError(null)
    }
  }, [templatesQueryError])

  // Populate templates when data arrives
  useEffect(() => {
    if (templatesResponse?.status_code === 200 && templatesResponse.record) {
      const transformedTemplates = templatesResponse.record.map(transformApiTemplateToLeadTimeTemplate)
      setCustomTemplates(transformedTemplates)
    }
  }, [templatesResponse])

  // Retry handler for templates (passed to TemplateGrid)
  const handleRetryTemplates = () => {
    refetchTemplates()
  }

  // Automatically show table view when component receives existing lead time data
  React.useEffect(() => {
    if (manufacture_lead_times && manufacture_lead_times.length > 0) {
      setShowCustomTable(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacture_lead_times?.length])

  // Clear applied template name when data is manually modified
  React.useEffect(() => {
    if (appliedTemplateName && savedTemplateData) {
      if (hasDataChanged()) {
        setAppliedTemplateName(null)
        setIsLoadedViaAddEdit(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacture_lead_times, localTemplateName])

  // Check if current data matches any saved template and set savedTemplateData accordingly
  React.useEffect(() => {
    if (
      manufacture_lead_times && 
      manufacture_lead_times.length > 0 && 
      localTemplateName && 
      localTemplateName.trim() !== '' &&
      customTemplates.length > 0
    ) {
      // Find matching template by name and data
      const matchingTemplate = customTemplates.find(template => {
        // Check if name matches
        if (template.name.trim().toLowerCase() !== localTemplateName.trim().toLowerCase()) {
          return false
        }

        // Check if lead times match
        const sortedCurrent = sortLeadTimes(manufacture_lead_times)
        const sortedTemplate = sortLeadTimes(template.leadTimes)

        if (sortedCurrent.length !== sortedTemplate.length) {
          return false
        }

        // Check if all entries match exactly
        return sortedCurrent.every((current, index) => {
          const templateEntry = sortedTemplate[index]
          return (
            current.quantity_range === templateEntry.quantity_range &&
            current.lead_time_value === templateEntry.lead_time_value &&
            current.lead_time_unit === templateEntry.lead_time_unit &&
            current.start_qty === templateEntry.start_qty &&
            current.end_qty === templateEntry.end_qty
          )
        })
      })

      // If matching template found and we don't already have savedTemplateData set, set it
      if (matchingTemplate && (!savedTemplateData || savedTemplateData.name !== matchingTemplate.name)) {
        setSavedTemplateData({
          name: matchingTemplate.name,
          leadTimes: [...matchingTemplate.leadTimes]
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacture_lead_times, localTemplateName, customTemplates])

  // Check if current data matches any existing template data (by data only) and activate it
  React.useEffect(() => {
    if (
      manufacture_lead_times && 
      manufacture_lead_times.length > 0 &&
      customTemplates.length > 0
    ) {
      // Find matching template by data only (regardless of name)
      const matchingTemplate = customTemplates.find(template => {
        // Check if lead times match
        const sortedCurrent = sortLeadTimes(manufacture_lead_times)
        const sortedTemplate = sortLeadTimes(template.leadTimes)

        if (sortedCurrent.length !== sortedTemplate.length) {
          return false
        }

        // Check if all entries match exactly
        return sortedCurrent.every((current, index) => {
          const templateEntry = sortedTemplate[index]
          return (
            current.quantity_range === templateEntry.quantity_range &&
            current.lead_time_value === templateEntry.lead_time_value &&
            current.lead_time_unit === templateEntry.lead_time_unit &&
            current.start_qty === templateEntry.start_qty &&
            current.end_qty === templateEntry.end_qty
          )
        })
      })

      // If matching template found, activate it
      if (matchingTemplate) {
        // Set as last used template (shows "Activated" tag)
        setLastUsedTemplateId(matchingTemplate.id)
        
        // Set saved template data if not already set
        if (!savedTemplateData || savedTemplateData.name !== matchingTemplate.name) {
          setSavedTemplateData({
            name: matchingTemplate.name,
            leadTimes: [...matchingTemplate.leadTimes]
          })
        }
        
        // Set applied template name to show badge (only if not loaded via Add/Edit)
        if (!isLoadedViaAddEdit && (!appliedTemplateName || appliedTemplateName !== matchingTemplate.name)) {
          setAppliedTemplateName(matchingTemplate.name)
        }
        
        // Set local template name if it's empty or different
        if (!localTemplateName || localTemplateName.trim() === '' || localTemplateName.trim().toLowerCase() !== matchingTemplate.name.trim().toLowerCase()) {
          setLocalTemplateName(matchingTemplate.name)
          if (onLeadTimeNameChange) {
            onLeadTimeNameChange(matchingTemplate.name)
          }
        }
      } else {
        // If no matching template found, clear the last used template if data doesn't match
        if (lastUsedTemplateId) {
          const currentLastUsed = customTemplates.find(t => t.id === lastUsedTemplateId)
          if (currentLastUsed) {
            const sortedCurrent = sortLeadTimes(manufacture_lead_times)
            const sortedTemplate = sortLeadTimes(currentLastUsed.leadTimes)
            
            if (sortedCurrent.length !== sortedTemplate.length || 
                !sortedCurrent.every((current, index) => {
                  const templateEntry = sortedTemplate[index]
                  return (
                    current.quantity_range === templateEntry.quantity_range &&
                    current.lead_time_value === templateEntry.lead_time_value &&
                    current.lead_time_unit === templateEntry.lead_time_unit &&
                    current.start_qty === templateEntry.start_qty &&
                    current.end_qty === templateEntry.end_qty
                  )
                })) {
              setLastUsedTemplateId(null)
            }
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacture_lead_times, customTemplates])

  // Find newly saved template and set it as last used
  React.useEffect(() => {
    if (newlySavedTemplateName && customTemplates.length > 0) {
      const newTemplate = customTemplates.find(
        t => t.name.trim().toLowerCase() === newlySavedTemplateName.trim().toLowerCase()
      )
      if (newTemplate) {
        setLastUsedTemplateId(newTemplate.id)
        setNewlySavedTemplateName(null) // Clear the flag
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customTemplates, newlySavedTemplateName])


  // Function to load template when Add/Edit or Edit is clicked
  const handleApplyTemplate = (template: LeadTimeTemplate, isAddEdit: boolean = false) => {
    if (onApplyTemplate) {
      // Apply the template data via callback
      onApplyTemplate(template.leadTimes)
    }
    // Set the template name in both local state and parent
    setLocalTemplateName(template.name)
    if (onLeadTimeNameChange) {
      onLeadTimeNameChange(template.name)
    }
    // Track last used template
    setLastUsedTemplateId(template.id)
    // Set saved template data to match the applied template
    // This will make the button show green and be disabled since data matches saved template
    setSavedTemplateData({
      name: template.name,
      leadTimes: [...template.leadTimes]
    })
    
    // If it's "Add/Edit" button, don't set appliedTemplateName yet - wait for Apply button click
    // If it's "Edit" button, immediately set appliedTemplateName (show badge)
    if (isAddEdit) {
      setAppliedTemplateName(null)
      setIsLoadedViaAddEdit(true)
    } else {
      setAppliedTemplateName(template.name)
      setIsLoadedViaAddEdit(false)
    }
    
    // Always show the custom table view when a template is loaded
    setShowCustomTable(true)
    toast.success(`Template "${template.name}" loaded`)
  }

  // Function to confirm and apply template (show badge)
  const handleConfirmApply = () => {
    if (localTemplateName && localTemplateName.trim() !== '') {
      setAppliedTemplateName(localTemplateName.trim())
      setIsLoadedViaAddEdit(false)
      toast.success(`Template "${localTemplateName}" applied successfully`)
    }
  }


  const handleDeleteCustomTemplate = async (templateId: string, templateName: string) => {
    try {
      const result = await leadTimeService.deleteLeadTimeTemplate(templateId)

      if (result?.status_code === 200) {
        // Remove from local state
        setCustomTemplates(customTemplates.filter(t => t.id !== templateId))
        // Clear last used indicator if deleted template was the last used
        if (lastUsedTemplateId === templateId) {
          setLastUsedTemplateId(null)
        }
        toast.success(result?.message || 'Template deleted successfully')
      } else {
        throw new Error(result?.message || 'Failed to delete template')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete template')
    }
  }

  const allTemplates = customTemplates

  const handleUpdateLeadTimeValue = (index: number, value: string) => {
    const leadTime = manufacture_lead_times[index]
    if (value === '') {
      // Allow clearing the field by setting to 0
      onUpdateLeadTime(index, 0, leadTime.lead_time_unit)
    } else {
      const timeValue = parseFloat(value)
      if (!isNaN(timeValue) && timeValue > 0) {
        onUpdateLeadTime(index, timeValue, leadTime.lead_time_unit)
      }
    }
  }

  const handleUpdateLeadTimeUnit = (index: number, unit: string) => {
    const leadTime = manufacture_lead_times[index]
    onUpdateLeadTime(index, leadTime.lead_time_value, unit)
  }

  // Function to check if a template with same name already exists
  const checkDuplicateName = (templateName: string): boolean => {
    if (!templateName || templateName.trim() === '') return false
    const trimmedName = templateName.trim().toLowerCase()
    return customTemplates.some(template => 
      template.name.trim().toLowerCase() === trimmedName
    )
  }

  // Function to check if lead time data matches any existing template (regardless of name)
  const checkDuplicateData = (leadTimes: LeadTimeEntry[]): boolean => {
    // Transform current lead times to API format for comparison
    const sortedLeadTimes = sortLeadTimes(leadTimes)
    const currentLeadTimeData = sortedLeadTimes.map(lt => ({
      start_qty: lt.start_qty,
      end_qty: lt.end_qty,
      lead_time: lt.lead_time_value,
      lead_time_unit: lt.lead_time_unit
    }))

    // Sort function for comparison
    const sortLeadTimeData = (a: any, b: any) => {
      if (a.start_qty !== b.start_qty) return a.start_qty - b.start_qty
      if (a.end_qty !== b.end_qty) return a.end_qty - b.end_qty
      return 0
    }

    const sortedCurrent = [...currentLeadTimeData].sort(sortLeadTimeData)

    // Check each existing template
    for (const template of customTemplates) {
      // Transform template lead times to API format for comparison
      const templateLeadTimeData = template.leadTimes.map(lt => ({
        start_qty: lt.start_qty,
        end_qty: lt.end_qty,
        lead_time: lt.lead_time_value,
        lead_time_unit: lt.lead_time_unit
      }))

      const sortedTemplate = [...templateLeadTimeData].sort(sortLeadTimeData)

      // Check if arrays have same length
      if (sortedCurrent.length !== sortedTemplate.length) {
        continue
      }

      // Check if all entries match exactly
      const allMatch = sortedCurrent.every((current, index) => {
        const templateEntry = sortedTemplate[index]
        return (
          current.start_qty === templateEntry.start_qty &&
          current.end_qty === templateEntry.end_qty &&
          current.lead_time === templateEntry.lead_time &&
          current.lead_time_unit === templateEntry.lead_time_unit
        )
      })

      if (allMatch) {
        return true // Duplicate data found
      }
    }

    return false // No duplicate data found
  }

  // Function to check if current data has changed compared to saved data
  const hasDataChanged = (): boolean => {
    if (!savedTemplateData) {
      return true // No saved data, so consider it as changed (needs saving)
    }

    // Compare template name
    if (localTemplateName.trim() !== savedTemplateData.name.trim()) {
      return true
    }

    // Compare lead times
    const sortedCurrent = sortLeadTimes(manufacture_lead_times)
    const sortedSaved = sortLeadTimes(savedTemplateData.leadTimes)

    if (sortedCurrent.length !== sortedSaved.length) {
      return true
    }

    // Check if all entries match exactly
    const allMatch = sortedCurrent.every((current, index) => {
      const saved = sortedSaved[index]
      return (
        current.quantity_range === saved.quantity_range &&
        current.lead_time_value === saved.lead_time_value &&
        current.lead_time_unit === saved.lead_time_unit &&
        current.start_qty === saved.start_qty &&
        current.end_qty === saved.end_qty
      )
    })

    return !allMatch
  }

  // Function to save template
  const handleSaveTemplate = async () => {
    // Clear previous duplicate errors
    setDuplicateError(null)

    // Validate template name
    if (!localTemplateName || localTemplateName.trim() === '') {
      toast.error('Please enter a template name')
      return
    }

    // Validate that there are lead times
    if (!manufacture_lead_times || manufacture_lead_times.length === 0) {
      toast.error('Please add at least one lead time entry')
      return
    }

    // Validate that all 4 required quantity ranges are present
    if (!hasAllRequiredRanges()) {
      const missingRanges = REQUIRED_QUANTITY_RANGES.filter(
        range => !manufacture_lead_times.some(lt => lt.quantity_range === range)
      )
      toast.error(`Please add lead times for all required quantity ranges. Missing: ${missingRanges.join(', ')}`)
      return
    }

    // Validate that all time fields are filled (not blank or 0)
    const hasBlankTimeFields = manufacture_lead_times.some(lt => !lt.lead_time_value || lt.lead_time_value === 0)
    if (hasBlankTimeFields) {
      toast.error('All time fields must be filled with values greater than 0')
      return
    }

    // Check for duplicate name
    const isDuplicateName = checkDuplicateName(localTemplateName)
    // Check for duplicate data (regardless of name)
    const isDuplicateData = checkDuplicateData(manufacture_lead_times)

    // Show appropriate error message
    if (isDuplicateName && isDuplicateData) {
      setDuplicateError('Template name and data already exist. Please change both.')
      return
    } else if (isDuplicateName) {
      setDuplicateError('Template name already exists. Please change the name.')
      return
    } else if (isDuplicateData) {
      setDuplicateError('Data already exists. Please change the lead time values.')
      return
    }

    setIsSavingTemplate(true)
    try {
      // Transform manufacture_lead_times to API format (sorted in ascending order)
      const sortedLeadTimes = sortLeadTimes(manufacture_lead_times)
      const manufacture_lead_time = sortedLeadTimes.map(lt => ({
        start_qty: lt.start_qty,
        end_qty: lt.end_qty,
        lead_time: lt.lead_time_value,
        lead_time_unit: lt.lead_time_unit
      }))

      const result = await leadTimeService.createLeadTimeTemplate({
        name: localTemplateName.trim(),
        manufacture_lead_time
      })

      if (result?.status_code === 200) {
        toast.success('Template saved successfully!')
        // Store saved template data
        setSavedTemplateData({
          name: localTemplateName.trim(),
          leadTimes: [...manufacture_lead_times]
        })
        // Set the template name to find after refresh
        setNewlySavedTemplateName(localTemplateName.trim())
        // Refresh templates list
        await refetchTemplates()
        
        if (onLeadTimeNameChange) {
          onLeadTimeNameChange('')
        }
      } else {
        throw new Error(result?.message || 'Failed to save template')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save template')
    } finally {
      setIsSavingTemplate(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 mt-5">
          <Label className="font-semibold text-gray-600 body-3 font-urbanist text-sm">
            Lead Time for Manufacturing {required && '*'}
          </Label>
          {appliedTemplateName && (
            <div className="flex items-center gap-1.5">
              <div className="bg-green-50 rounded-full px-3 py-1 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span className="text-green-600 text-xs body-3 font-urbanist font-semibold">
                  Template Used: {appliedTemplateName}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!showCustomTable ? (
            <Button 
              type="button"
              onClick={() => setShowCustomTable(true)}
              className="h-7 px-3 body-3 font-urbanist text-sm bg-white text-secondary-900 border border-secondary-900 hover:bg-gray-50"
            >
              Add/Create Custom
            </Button>
          ) : (
            <>
              {localTemplateName && localTemplateName.trim() !== '' && !appliedTemplateName && isLoadedViaAddEdit && (
                <Button 
                  type="button"
                  onClick={handleConfirmApply}
                  className="h-7 px-3 body-3 font-urbanist text-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Apply
                </Button>
              )}
              <Button 
                type="button"
                onClick={() => {
                  setShowCustomTable(false)
                  setAppliedTemplateName(null)
                  setLocalTemplateName('')
                  setIsLoadedViaAddEdit(false)
                  if (onLeadTimeNameChange) {
                    onLeadTimeNameChange('')
                  }
                }}
                className="h-7 px-3 body-3 font-urbanist text-sm bg-white text-secondary-900 border border-secondary-900 hover:bg-gray-50"
              >
                Change Template
              </Button>
            </>
          )}
        </div>
      </div>

      <TemplateGrid
        show={!showCustomTable}
        isLoading={isLoadingTemplates}
        error={templatesError}
        templates={allTemplates}
        lastUsedTemplateId={lastUsedTemplateId}
        onRetry={handleRetryTemplates}
        onDelete={handleDeleteCustomTemplate}
        onApply={handleApplyTemplate}
      />
      
      {/* Custom Lead Time Input Section - Animated */}
      <AnimatePresence>
        {showCustomTable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >

            <LeadTimeForm
              localTemplateName={localTemplateName}
              onTemplateNameChange={(value) => {
                setLocalTemplateName(value)
                setDuplicateError(null)
              }}
              duplicateError={duplicateError}
              errors={errors}
              quantity_range={quantity_range}
              lead_time_value={lead_time_value}
              lead_time_unit={lead_time_unit}
              manufacture_lead_times={manufacture_lead_times}
              onQuantityRangeChange={onQuantityRangeChange}
              onLeadTimeValueChange={onLeadTimeValueChange}
              onLeadTimeUnitChange={onLeadTimeUnitChange}
              onAddLeadTime={onAddLeadTime}
              onLeadTimeNameChange={onLeadTimeNameChange}
            />
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Display added lead times in table format - Animated */}
      <AnimatePresence>
        {showCustomTable && manufacture_lead_times && manufacture_lead_times.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut', delay: 0.1 }}
            className="mt-3"
          >
          <LeadTimeTable
            leadTimes={manufacture_lead_times}
            onUpdateLeadTime={onUpdateLeadTime}
            onRemoveLeadTime={onRemoveLeadTime}
          />
          </motion.div>
      )}
      </AnimatePresence>
      
      {showCustomTable && hasAllRequiredRanges() && (!localTemplateName || localTemplateName.trim() === '') && (
        <p className="text-xs text-primary-900 body-3 font-urbanist mt-2">
          All quantity ranges are set. Please enter a template name to save this configuration.
        </p>
      )}
      
      {/* Error display for manufacture_lead_times */}
      {errors.manufacture_lead_times && <p className="text-xs text-red-600 mt-1">{errors.manufacture_lead_times}</p>}

      <SaveBar
        show={!!(showCustomTable && manufacture_lead_times && manufacture_lead_times.length > 0)}
        hasAllRequiredRanges={hasAllRequiredRanges()}
        duplicateError={duplicateError}
        isSaving={isSavingTemplate}
        templateName={localTemplateName}
        hasDataChanged={hasDataChanged()}
        onSave={handleSaveTemplate}
      />

    </div>
  )
}

// Re-export validation helper for consumers importing from this module
export { validateLeadTimes } from './lead-time/utils'
export type { LeadTimeEntry } from '../types/inventory.types'

