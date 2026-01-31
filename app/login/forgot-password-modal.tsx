"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { Check, RotateCcw } from "lucide-react"
import { useSendChangePasswordMutation } from "@/hooks"

const forgotPasswordFormSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const sendChangePasswordMutation = useSendChangePasswordMutation()
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: ""
    }
  })

  // Reset states when modal opens/closes
  useEffect(() => {
    if (!open) {
      setShowSuccess(false)
      setShowError(false)
      setErrorMessage("")
      forgotPasswordForm.reset()
    }
  }, [open, forgotPasswordForm])

  const handleForgotPasswordSubmit = async (values: ForgotPasswordFormValues) => {
    setShowSuccess(false)
    setShowError(false)
    setErrorMessage("")

    sendChangePasswordMutation.mutate(values.email, {
      onSuccess: (result) => {
        if (result.success) {
          setShowSuccess(true)
          toast.success(result.message || "Password reset email sent successfully")
          // Auto-close after showing success animation for 2 seconds
          setTimeout(() => {
            onOpenChange(false)
            setShowSuccess(false)
            forgotPasswordForm.reset()
          }, 2000)
        } else {
          const error = result.error || "Failed to send password reset email"
          setErrorMessage(error)
          // Show full retry section for errors (especially 400)
          setShowError(true)
          toast.error(error)
        }
      },
      onError: () => {
        const error = "Network error. Please check your connection and try again."
        setErrorMessage(error)
        setShowError(true)
        toast.error(error)
      },
    })
  }

  const handleRetry = () => {
    setShowError(false)
    setErrorMessage("")
    forgotPasswordForm.reset()
  }

  const handleClose = () => {
    onOpenChange(false)
    forgotPasswordForm.reset()
    setShowSuccess(false)
    setShowError(false)
    setErrorMessage("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-neutral-800 font-urbanist">
            Forgot Password
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-600 font-urbanist">
            Enter your email to receive a password reset link.
          </DialogDescription>
        </DialogHeader>
        
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <Check 
                className="w-8 h-8 text-green-600 stroke-[2.5]" 
                style={{
                  animation: 'checkmarkScale 0.4s ease-in-out'
                }}
              />
            </div>
            <p className="text-base font-semibold text-green-600 font-urbanist text-center">
              Email sent successfully
            </p>
          </div>
        ) : showError ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-red-600 font-urbanist">
                {errorMessage}
              </p>
            </div>
            <Button
              type="button"
              onClick={handleRetry}
              variant="outline"
              className="w-full h-11 font-urbanist border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all"
            >
              <RotateCcw 
                className="w-4 h-4 mr-2" 
                style={{
                  animation: 'retryRotate 1.5s linear'
                }}
              />
              Try Different Email
            </Button>
          </div>
        ) : (
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPasswordSubmit)} className="space-y-4">
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-800 font-urbanist">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        {...field}
                        className="h-10 border-neutral-300 focus:border-primary-600 focus:ring-primary-600 text-sm font-urbanist"
                        disabled={sendChangePasswordMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="font-urbanist"
                  disabled={sendChangePasswordMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-secondary-800 hover:bg-secondary-900 text-white text-sm font-medium font-urbanist"
                  disabled={sendChangePasswordMutation.isPending || !forgotPasswordForm.formState.isValid}
                >
                  {sendChangePasswordMutation.isPending ? "Sending..." : "Send Link"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
        
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes checkmarkScale {
              0% {
                transform: scale(0);
              }
              50% {
                transform: scale(1.1);
              }
              100% {
                transform: scale(1);
              }
            }
            @keyframes retryRotate {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `
        }} />
      </DialogContent>
    </Dialog>
  )
}

