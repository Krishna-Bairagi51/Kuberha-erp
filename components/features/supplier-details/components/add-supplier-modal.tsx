'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { supplierService, type CreateSellerRequest } from '../services/supplier.service'
import { queryKeys } from '@/lib/query'
import { LoadingSpinner } from '@/components/shared/ui/loading-spinner'
import { toast } from 'sonner'

// Zod validation schema
const addSupplierSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').min(1, 'Name is required'),
    email: z.string().email('Invalid email address').min(1, 'Email is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    mobile: z
      .string()
      .min(10, 'Mobile number must be 10 digits')
      .max(10, 'Mobile number must be 10 digits')
      .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
    address: z.string().min(5, 'Address must be at least 5 characters').min(1, 'Address is required'),
    city: z.string().min(2, 'City must be at least 2 characters').min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pinCode: z
      .string()
      .min(6, 'Pin code must be 6 digits')
      .max(6, 'Pin code must be 6 digits')
      .regex(/^\d{6}$/, 'Pin code must be exactly 6 digits'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type AddSupplierFormData = z.infer<typeof addSupplierSchema>

interface AddSupplierModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: AddSupplierFormData) => void | Promise<void>
}

export function AddSupplierModal({ open, onOpenChange, onSubmit }: AddSupplierModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const queryClient = useQueryClient()
  
  const form = useForm<AddSupplierFormData>({
    resolver: zodResolver(addSupplierSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
    },
    mode: 'onChange',
  })

  // Fetch states using React Query (TanStack Query)
  const {
    data: statesData,
    isLoading: isLoadingStates,
    error: statesError,
  } = useQuery({
    queryKey: queryKeys?.supplier?.states() ?? ['supplier', 'states'],
    queryFn: () => supplierService.getStates(),
    enabled: open, // Only fetch when modal is open
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (states don't change often)
  })

  const states = statesData?.record || []

  // Mutation for creating supplier
  const createSupplierMutation = useMutation({
    mutationFn: async (data: AddSupplierFormData) => {
      // Validate state ID exists
      const stateId = Number(data.state)
      if (!stateId || isNaN(stateId)) {
        throw new Error('Please select a valid state')
      }

      const stateExists = states.some((s) => s.id === stateId)
      if (!stateExists) {
        throw new Error('Please select a valid state')
      }

      const payload: CreateSellerRequest = {
        email: data.email,
        name: data.name,
        mobile: data.mobile,
        address: data.address,
        city: data.city,
        zip: data.pinCode,
        state_id: stateId,
        password: data.password,
      }

      return await supplierService.createSeller(payload)
    },
    onSuccess: () => {
      toast.success('Supplier added successfully')
      // Clear sensitive password fields immediately before reset
      form.setValue('password', '')
      form.setValue('confirmPassword', '')
      form.reset()
      onOpenChange(false)
      // Invalidate supplier list to refresh the table
      queryClient.invalidateQueries({ queryKey: queryKeys?.supplier?.all ?? ['supplier'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add supplier')
    },
  })

  const handleSubmit = async (data: AddSupplierFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data)
        // Clear sensitive password fields immediately
        form.setValue('password', '')
        form.setValue('confirmPassword', '')
        form.reset()
        onOpenChange(false)
      } else {
        // Use the mutation to create supplier via API
        await createSupplierMutation.mutateAsync(data)
        // Clear sensitive password fields immediately after submission completes
        form.setValue('password', '')
        form.setValue('confirmPassword', '')
      }
    } catch (error) {
      // Clear passwords even on error for security
      form.setValue('password', '')
      form.setValue('confirmPassword', '')
      // Error is already handled by mutation onError
      if (!onSubmit) {
        // Only show error if not using custom onSubmit handler
        // (mutation already shows error toast)
        return
      }
      toast.error(error instanceof Error ? error.message : 'Failed to add supplier')
    }
  }

  const handleClose = () => {
    // Clear sensitive password fields immediately when closing
    form.setValue('password', '')
    form.setValue('confirmPassword', '')
    form.reset()
    setShowPassword(false)
    setShowConfirmPassword(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 font-urbanist">
            Add Supplier
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 font-urbanist">
            Fill in the supplier details below. All fields are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-4">
              {/* Row 1: Email and Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 font-urbanist">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          {...field}
                          className="h-10 font-urbanist text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-urbanist" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 font-urbanist">
                        Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter supplier name"
                          {...field}
                          className="h-10 font-urbanist text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-urbanist" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Password and Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 font-urbanist">
                        Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter password (min 8 characters)"
                            {...field}
                            className="h-10 font-urbanist text-sm pr-10"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage className="text-xs font-urbanist" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 font-urbanist">
                        Confirm Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            {...field}
                            className="h-10 font-urbanist text-sm pr-10"
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage className="text-xs font-urbanist" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: Phone number and State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 font-urbanist">
                        Mobile
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter 10-digit mobile number"
                          maxLength={10}
                          {...field}
                          className="h-10 font-urbanist text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-urbanist" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 font-urbanist">
                        State
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingStates}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 font-urbanist text-sm">
                            <SelectValue
                              placeholder={
                                isLoadingStates
                                  ? 'Loading states...'
                                  : statesError
                                    ? 'Failed to load states'
                                    : 'Select state'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[110]">
                          {isLoadingStates ? (
                            <div className="flex items-center justify-center p-4">
                              <LoadingSpinner />
                            </div>
                          ) : statesError ? (
                            <div className="p-4 text-sm text-red-600 font-urbanist">
                              Failed to load states. Please try again.
                            </div>
                          ) : states.length > 0 ? (
                            states.map((state) => (
                              <SelectItem
                                key={state.id}
                                value={state.id.toString()}
                                className="font-urbanist"
                              >
                                {state.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-4 text-sm text-gray-500 font-urbanist">
                              No states available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs font-urbanist" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 4: Address (full width) */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 font-urbanist">
                      Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Enter address"
                        {...field}
                        className="h-10 font-urbanist text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-urbanist" />
                  </FormItem>
                )}
              />

              {/* Row 5: City and Pin Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 font-urbanist">
                        City
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter city"
                          {...field}
                          className="h-10 font-urbanist text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-urbanist" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 font-urbanist">
                        Pin Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter 6-digit pin code"
                          maxLength={6}
                          {...field}
                          className="h-10 font-urbanist text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-urbanist" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-10 px-4 font-urbanist font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 px-4 bg-secondary-900 hover:bg-secondary-800 text-white font-urbanist font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={createSupplierMutation.isPending}
              >
                {createSupplierMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    Adding...
                  </span>
                ) : (
                  'Add Supplier'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

