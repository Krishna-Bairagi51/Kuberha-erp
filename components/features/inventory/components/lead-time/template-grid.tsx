"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Clock, Factory, Pencil, Plus, Check, Trash2 } from 'lucide-react'
import type { LeadTimeEntry } from '../../types/inventory.types'

export interface LeadTimeTemplateCard {
  id: string
  name: string
  isCustom: boolean
  leadTimes: LeadTimeEntry[]
}

interface TemplateGridProps {
  show: boolean
  isLoading: boolean
  error: string | null
  templates: LeadTimeTemplateCard[]
  lastUsedTemplateId: string | null
  onRetry: () => void
  onDelete: (id: string, name: string) => void
  onApply: (template: LeadTimeTemplateCard, isAddEdit?: boolean) => void
}

export const TemplateGrid: React.FC<TemplateGridProps> = ({
  show,
  isLoading,
  error,
  templates,
  lastUsedTemplateId,
  onRetry,
  onDelete,
  onApply,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden mb-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8 mt-3">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-secondary-900 mb-2" />
                <p className="text-sm text-gray-600 body-3 font-urbanist">Loading templates...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-red-600 body-3 font-urbanist">{error}</p>
                <Button
                  type="button"
                  onClick={onRetry}
                  className="h-7 px-3 text-xs body-3 font-urbanist bg-red-600 hover:bg-red-700 text-white"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 mt-3">
              <p className="text-sm text-gray-600 body-3 font-urbanist">No templates available</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 mt-3">
              {templates.map((template) => {
                const isLastUsed = lastUsedTemplateId === template.id
                return (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 relative transition-all ${
                      isLastUsed
                        ? 'border-green-500 bg-green-50'
                        : template.isCustom
                          ? 'border-orange-300 bg-orange-50'
                          : 'border-gray-200 bg-blue-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onDelete(template.id, template.name)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-500 hover:bg-red-50 rounded-md p-1 transition-colors z-10"
                      title="Delete Template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center justify-between mb-3 pr-6">
                      <div className="flex items-center gap-2 flex-1">
                        <h3 className="font-semibold text-gray-800 body-3 font-urbanist text-sm">
                          {template.name}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {template.leadTimes.map((lt, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs body-3 font-urbanist">
                          <Factory className="h-3 w-3 text-gray-500" />
                          <span className="text-gray-700">Quantity "{lt.quantity_range}"</span>
                          <Clock className="h-3 w-3 text-gray-500 ml-auto" />
                          <span className="text-gray-700">{lt.lead_time_value} {lt.lead_time_unit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      {isLastUsed ? (
                        <div className="bg-green-600 rounded-full px-2 py-1 shadow-md flex items-center gap-1">
                          <Check className="h-3.5 w-3.5 text-white" />
                          <span className="text-white text-xs body-3 font-urbanist font-semibold">Activated</span>
                        </div>
                      ) : (
                        <div></div>
                      )}
                      <Button
                        type="button"
                        onClick={() => onApply(template, !isLastUsed)}
                        className="h-6 px-2 text-xs body-3 font-urbanist bg-secondary-900 hover:bg-secondary-800 text-white"
                      >
                        {isLastUsed ? (
                          <>
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            Add/Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default TemplateGrid

