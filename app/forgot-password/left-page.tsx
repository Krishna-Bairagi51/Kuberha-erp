"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { toast } from 'sonner'
import { updatePassword } from "@/app/forgot-password/api"

// Form schema for password reset
const passwordResetFormSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string()
    .min(1, "Password is required")
    .min(3, "Password must be at least 3 characters"),
  confirmPassword: z.string()
    .min(1, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type PasswordResetFormValues = z.infer<typeof passwordResetFormSchema>

interface LeftPageProps {
  token?: string
}

export function LeftPage({ token }: LeftPageProps) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalStatus, setModalStatus] = useState<200 | 400 | undefined>(undefined)

  // Form instance
  const passwordResetForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  })

  const handlePasswordReset = async (values: PasswordResetFormValues) => {
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      if (!token) {
        const message = "Invalid reset token. Please check your email link."
        setError(message)
        toast.error(message)
        setIsSubmitting(false)
        return
      }

      const result = await updatePassword(values.email, values.password, token)
      
      // Get status_code from result
      let statusCode: number | undefined
      if ('status_code' in result) {
        statusCode = result.status_code
      } else if ('success' in result && result.success && result.data) {
        statusCode = result.data.status_code
      } else if ('success' in result && result.success) {
        statusCode = 200 // Default to 200 for success
      }
      
      // Show modal for 200 or 400 status codes
      if (statusCode === 200 || statusCode === 400) {
        let message = ""
        if ('message' in result && result.message) {
          message = result.message
        } else if ('success' in result && result.success && result.message) {
          message = result.message
        } else {
          message = statusCode === 200 ? "Password Updated Successfully." : "Failed to update password."
        }
        
        setModalMessage(message)
        setModalStatus(statusCode as 200 | 400)
        setIsModalOpen(true)
        setIsSubmitting(false)
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else if ('success' in result && result.success) {
        // For other success cases (shouldn't happen with current API, but keeping for safety)
        setSuccess(result.message || "Password reset successfully!")
        toast.success(result.message || "Password reset successfully!")
        
        // Reset form after success
        setTimeout(() => {
          passwordResetForm.reset()
          setIsSubmitting(false)
        }, 2000)
      } else {
        const message = result.message || "Failed to reset password. Please try again."
        setError(message)
        toast.error(message)
        setIsSubmitting(false)
      }
    } catch (err) {
      const message = "Failed to reset password. Please try again."
      setError(message)
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Modal for API response messages - styled like authorization popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[12px] shadow-lg max-w-[520px] w-full p-[20px] min-h-[200px] flex flex-col">
            {/* Icon and Title Section */}
            <div className="flex items-center gap-3 mb-[16px]">
              {modalStatus === 200 ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              ) : modalStatus === 400 ? (
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              ) : null}
              <h3 className="text-[16px] font-urbanist font-semibold text-[#212b36]">
                {modalStatus === 200 
                  ? "Success" 
                  : modalStatus === 400
                  ? "Error"
                  : "Notice"}
              </h3>
            </div>
            
            {/* Message Content */}
            <div className="flex-1 mb-[16px]">
              <p className="text-[14px] text-gray-800 leading-[20px] font-urbanist">
                {modalMessage}
              </p>
            </div>
            
            {/* Redirect Tag - consistent height for both cases */}
            <div className="mt-auto">
              <div className="inline-flex items-center justify-center w-full px-3 py-2 bg-neutral-100 rounded-[8px] border border-neutral-200">
                <span className="text-xs text-neutral-600 font-urbanist font-medium">
                  Redirecting to login page...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-[600px] h-full flex flex-col items-center justify-between py-12">
      {/* Top Section - Logo */}
      <div className="flex justify-center">
        <Image
          src="/images/Logo_Casa Carigar_TERRACOTTA 1.png"
          alt="Logo Casa"
          width={600}
          height={600}
          className="object-contain"
        />
      </div>

      {/* Middle Section - Content */}
      <div className="flex flex-col items-center flex-1 justify-center w-full">
        {/* Text content */}
        <div className="text-center mb-10 justify-center w-[420px]">
          <p className="text-5xl font-semibold text-neutral-700 mb-4 font-urbanist text-center leading-tight">
            Reset Your <span className="text-primary-600 font-medium font-spectral">Password</span>
          </p>
          <p className="text-base weight-medium text-neutral-600 font-urbanist text-center">
            Enter your email and new password below
          </p>
        </div>

        {/* Success Messages */}
        {success && (
          <Alert className="mb-4 max-w-sm border-green-200 bg-green-50">
            <AlertDescription className="text-green-800 font-urbanist text-body-3">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Messages */}
        {error && (
          <Alert className="mb-4 max-w-sm border-red-200 bg-red-50">
            <AlertDescription className="text-red-800 font-urbanist text-body-3">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Password Reset Form */}
        <Form {...passwordResetForm}>
          <form onSubmit={passwordResetForm.handleSubmit(handlePasswordReset)} className="space-y-4 w-full max-w-sm">
            <FormField
              control={passwordResetForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-1 weight-medium primary text-neutral-1000 font-urbanist mb-1">
                    Email Address :
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      {...field}
                      className="h-11 border-neutral-300 focus:border-primary-600 focus:ring-primary-600 text-body-2 font-urbanist label-1 weight-medium"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordResetForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-1 weight-medium primary text-neutral-1000 font-urbanist mb-1">
                    Password :
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...field}
                        className="h-11 border-neutral-300 focus:border-primary-600 focus:ring-primary-600 text-body-2 font-urbanist label-1 weight-medium pr-12"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

                <FormField
              control={passwordResetForm.control}
              name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                  <FormLabel className="text-label-1 weight-medium primary text-neutral-1000 font-urbanist mb-1">
                    Confirm Password :
                        </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        {...field}
                        className="h-11 border-neutral-300 focus:border-primary-600 focus:ring-primary-600 text-body-2 font-urbanist label-1 weight-medium pr-12"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                        <button
                          type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 bg-secondary-800 !text-white hover:bg-secondary-900 text-label-1 font-medium font-urbanist mt-2"
              disabled={isSubmitting || !passwordResetForm.formState.isValid}
                >
              {isSubmitting ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
            </Form>
      </div>

      {/* Bottom Section - Footer */}
      <div className="text-center pt-4 border-t border-neutral-200 w-full max-w-sm">
        <p className="text-sm text-neutral-500 font-urbanist">
          Powered by Kuberha AI
        </p>
      </div>
    </div>
    </>
  )
}
