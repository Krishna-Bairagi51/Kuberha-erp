"use client"

import React, { useState, useEffect, useRef } from "react"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, X } from "lucide-react"
import { Category } from "@/components/features/website-setup/types/categories-management.types"
import {
  buildCategoryTree,
  CategoryTreeNode,
} from "@/components/features/website-setup/utills/categories-management.helpers"
import { useUpdateCategoryMutation } from "@/components/features/website-setup/hooks/use-categories-query"
import { toast } from "sonner"

interface AddEditCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null // If provided, it's edit mode
  categories?: Category[] // Categories list for parent selection
  onSubmit?: (data: {
    name: string
    imageFile: File | null
    parentId?: string
  }) => void | Promise<void>
}

function AddEditCategoryModal({
  open,
  onOpenChange,
  category,
  categories = [],
  onSubmit,
}: AddEditCategoryModalProps) {
  const [name, setName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [parentId, setParentId] = useState<string>("none")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasImageChanged, setHasImageChanged] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditMode = !!category
  const updateCategoryMutation = useUpdateCategoryMutation()

  // Helper function to get all descendant IDs (to prevent circular references)
  const getDescendantIds = (categoryId: string, tree: CategoryTreeNode[]): Set<string> => {
    const descendants = new Set<string>([categoryId])
    
    const findNode = (nodes: CategoryTreeNode[], id: string): CategoryTreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node
        if (node.children) {
          const found = findNode(node.children, id)
          if (found) return found
        }
      }
      return null
    }
    
    const node = findNode(tree, categoryId)
    if (node?.children) {
      node.children.forEach((child) => {
        descendants.add(child.id)
        const childDescendants = getDescendantIds(child.id, tree)
        childDescendants.forEach((id) => descendants.add(id))
      })
    }
    
    return descendants
  }

  // Build hierarchical tree
  const categoryTree = buildCategoryTree(categories)
  
  // Get IDs to exclude (current category and its descendants in edit mode)
  const excludedIds = isEditMode && category
    ? getDescendantIds(category.id, categoryTree)
    : new Set<string>()

  // Flatten tree with indentation for display
  const flattenTreeForSelect = (
    nodes: CategoryTreeNode[],
    level: number = 0
  ): Array<{ category: CategoryTreeNode; level: number; displayName: string }> => {
    const result: Array<{ category: CategoryTreeNode; level: number; displayName: string }> = []
    
    nodes.forEach((node) => {
      // Skip excluded categories (current category and its descendants)
      if (excludedIds.has(node.id)) {
        return
      }
      
      // Create indented display name with visual hierarchy
      const indent = "  ".repeat(level) // 2 spaces per level
      const prefix = level > 0 ? "└ " : ""
      const displayName = `${indent}${prefix}${node.name}`
      
      result.push({
        category: node,
        level,
        displayName,
      })
      
      // Recursively add children
      if (node.children && node.children.length > 0) {
        const children = flattenTreeForSelect(node.children, level + 1)
        result.push(...children)
      }
    })
    
    return result
  }

  // Get all categories for the dropdown (hierarchical)
  const hierarchicalCategories = flattenTreeForSelect(categoryTree)

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (open) {
      if (isEditMode && category) {
        // Edit mode: pre-fill values
        setName(category.name || "")
        setParentId(category.parentId || "none")
        setPreviewUrl(category.imageUrl || null)
        setSelectedFile(null) // Reset file selection
        setHasImageChanged(false) // Reset image change tracking
      } else {
        // Add mode: reset to empty
        setName("")
        setSelectedFile(null)
        setPreviewUrl(null)
        setParentId("none")
        setHasImageChanged(false)
      }
    } else {
      // Reset when closing
      setName("")
      setSelectedFile(null)
      setPreviewUrl(null)
      setParentId("none")
      setHasImageChanged(false)
    }
  }, [open, category, isEditMode])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file")
        return
      }
      setSelectedFile(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      // Mark image as changed in edit mode
      if (isEditMode) {
        setHasImageChanged(true)
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    // In edit mode, removing the image means we need to re-upload
    // So we clear the preview and mark as changed
    if (isEditMode) {
      setPreviewUrl(null)
      setHasImageChanged(true)
    } else {
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const isValid = name.trim().length > 0 && (selectedFile || previewUrl)
  // In edit mode, button is only enabled when image has changed
  const canUpdate = isEditMode ? hasImageChanged && selectedFile : isValid

  const handleSubmit = async () => {
    if (!canUpdate) return
    
    try {
      setIsSubmitting(true)
      
      if (isEditMode && category) {
        // Edit mode: call update API
        if (!selectedFile) {
          toast.error("Please upload a new image to update the category")
          return
        }
        
        // Call update API with File object (FormData)
        const response = await updateCategoryMutation.mutateAsync({
          id: parseInt(category.id),
          image: selectedFile,
        })
        
        if (response.status_code === 200) {
          toast.success(response.message || "Category updated successfully")
          // Invalidate queries to refresh the list
          onOpenChange(false)
        } else {
          toast.error(response.message || "Failed to update category")
        }
      } else {
        // Add mode: use existing onSubmit callback
        if (onSubmit) {
          await onSubmit({
            name: name.trim(),
            imageFile: selectedFile,
            parentId: parentId === "none" ? undefined : parentId,
          })
          // Only close and reset if onSubmit succeeds
          onOpenChange(false)
        }
      }
    } catch (error: any) {
      // Error handling
      const errorMessage = error?.message || "An error occurred. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Clean up preview URL if it's a blob
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            {isEditMode ? "Edit Category" : "Add New Category"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category Name */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-800">Category Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Enter category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
              disabled={isEditMode}
            />
          </div>

          {/* Category Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold text-gray-800">Category Image</Label>
                <p className="text-xs text-gray-500 mt-0.5">JPG, PNG and WEBP formats allowed</p>
              </div>
              <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                Required
              </span>
            </div>

            {previewUrl ? (
              <div className="relative border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile?.name || "Current image"}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label
                  htmlFor="category-image-upload"
                  className="flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-4 border-gray-300"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  <input
                    ref={fileInputRef}
                    id="category-image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Parent Category */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-800">Parent Category</Label>
            <Select value={parentId} onValueChange={setParentId} disabled={isEditMode}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select as Parent Category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="none">None (Top-level category)</SelectItem>
                {hierarchicalCategories.map(({ category, displayName, level }) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                    className="font-urbanist [&[data-state=checked]_span]:text-white"
                  >
                    <span 
                      className="text-sm text-gray-900 whitespace-pre font-urbanist block"
                      style={{ marginLeft: level > 0 ? `${level * 20}px` : '0' }}
                    >
                      {displayName}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {parentId !== "none"
                ? "This will be a child category"
                : "This will be a top-level parent category"}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="h-11 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canUpdate || isSubmitting || updateCategoryMutation.isPending}
            className="h-11 px-6 bg-secondary-900 hover:bg-secondary-800 text-white"
          >
            {isSubmitting || updateCategoryMutation.isPending
              ? "Updating..."
              : isEditMode
              ? "Update Category"
              : "Add Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddEditCategoryModal

