"use client"

import { useState, useEffect } from "react"
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
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useLoginMutation,
  useOTPVerifyMutation,
  useSendOTPMutation,
} from "@/hooks"
import { ForgotPasswordModal } from "./forgot-password-modal"

// Form schemas
const mobileFormSchema = z.object({
  mobile: z.string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits")
    .regex(/^\d+$/, "Mobile number must contain only digits")
})

const emailPasswordFormSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string()
    .min(1, "Password is required")
    .min(3, "Password must be at least 3 characters")
})

const otpFormSchema = z.object({
  otp: z.string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits")
})

type MobileFormValues = z.infer<typeof mobileFormSchema>
type EmailPasswordFormValues = z.infer<typeof emailPasswordFormSchema>
type OTPFormValues = z.infer<typeof otpFormSchema>

interface OTPLoginFormProps {
  onSuccess?: (authData: any) => void
}

export function OTPLoginForm({ onSuccess }: OTPLoginFormProps) {
  const [showOTPSection, setShowOTPSection] = useState(false)
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loginMethod, setLoginMethod] = useState<"phone" | "email">("email")
  const [showPassword, setShowPassword] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [isResendingOTP, setIsResendingOTP] = useState(false)
  const [countryCode, setCountryCode] = useState("+91")
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)

  // TanStack Query mutations for fast, optimized auth operations
  const loginMutation = useLoginMutation()
  const otpVerifyMutation = useOTPVerifyMutation()
  const sendOTPMutation = useSendOTPMutation()

  // Separate loading states for different buttons to prevent cross-interference
  const isSendingOTP = sendOTPMutation.isPending
  const isVerifyingOTP = otpVerifyMutation.isPending
  const isLoggingIn = loginMutation.isPending

  // Common country codes
  const countryCodes = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
  ]

  // Form instances
  const mobileForm = useForm<MobileFormValues>({
    resolver: zodResolver(mobileFormSchema),
    defaultValues: {
      mobile: ""
    }
  })

  const emailPasswordForm = useForm<EmailPasswordFormValues>({
    resolver: zodResolver(emailPasswordFormSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  })

  const otpForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: ""
    }
  })

  const toggleLoginMethod = () => {
    setLoginMethod(loginMethod === "phone" ? "email" : "phone")
    setShowOTPSection(false)
    setShowPassword(false)
    setError("")
    setSuccess("")
    // Reset timer
    setTimeLeft(0)
    setIsTimerActive(false)
    setIsResendingOTP(false)
    // Reset forms
    mobileForm.reset()
    emailPasswordForm.reset()
    otpForm.reset()
    setCountryCode("+91")
  }
  useEffect(() => {
  }, [])

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsTimerActive(false)
            return 0
          }
          return time - 1
        })
      }, 1000)
    } else if (timeLeft === 0) {
      setIsTimerActive(false)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTimerActive, timeLeft])

  const handleEmailPasswordLogin = async (values: EmailPasswordFormValues) => {
    setError("")
    setSuccess("")
    
    // Use mutation for optimized login flow
    // The mutation handles: API call, storage, cache invalidation, and redirect
    loginMutation.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: (result) => {
          if (result.success) {
            setSuccess("Login successful! Redirecting...")
            // onSuccess callback is optional now - mutation handles redirect
            if (onSuccess && result.data) {
              onSuccess(result.data)
            }
          } else {
            const message = result.error || "Login failed. Please check your credentials."
            setError(message)
            toast.error(`Login failed: ${message}`)
          }
        },
        onError: () => {
          const message = "Network error. Please check your connection and try again."
          setError(message)
          toast.error(`Network error: ${message}`)
        },
      }
    )
  }

  const handleSendOTP = async (values: MobileFormValues) => {
    setError("")
    setSuccess("")

    sendOTPMutation.mutate(values.mobile, {
      onSuccess: (result) => {
        if (result.success) {
          setSuccess(result.message || "OTP sent successfully to your mobile number")
          setShowOTPSection(true)
          // Start 30-second countdown timer
          setTimeLeft(30)
          setIsTimerActive(true)
        } else {
          setError(result.error || "Failed to send OTP")
        }
      },
      onError: () => {
        setError("Unexpected error occurred. Please try again.")
      },
    })
  }

  const handleVerifyOTP = async (values: OTPFormValues) => {
    const mobile = mobileForm.getValues("mobile")
    setError("")
    setSuccess("")

    otpVerifyMutation.mutate(
      { mobile, otp: values.otp },
      {
        onSuccess: (result) => {
          if (result.success && result.data) {
            setSuccess("Login successful! Redirecting...")
            // onSuccess callback is optional now - mutation handles redirect
            if (onSuccess) {
              onSuccess(result.data)
            }
          } else {
            const message = result.error || "The OTP you entered is not valid. Please try again."
            setError(message)
            toast.error(`OTP verification failed: ${message}`)
          }
        },
        onError: () => {
          const message = "Network error. Please check your connection and try again."
          setError(message)
          toast.error(`Network error: ${message}`)
        },
      }
    )
  }

  const handleResendOTP = async () => {
    const mobile = mobileForm.getValues("mobile")
    setError("")
    setSuccess("")
    setIsResendingOTP(true)

    sendOTPMutation.mutate(mobile, {
      onSuccess: (result) => {
        setIsResendingOTP(false)
        if (result.success) {
          setSuccess(result.message || "OTP resent successfully")
          setShowOTPSection(true)
          // Start 30-second countdown timer
          setTimeLeft(30)
          setIsTimerActive(true)
        } else {
          setError(result.error || "Failed to resend OTP")
        }
      },
      onError: () => {
        setIsResendingOTP(false)
        setError("Unexpected error occurred. Please try again.")
      },
    })
  }

  const formatMobileNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")
    return digits.slice(0, 10)
  }

  const formatOTP = (value: string) => {
    const digits = value.replace(/\D/g, "")
    return digits.slice(0, 6)
  }

  const handleEditClick = () => {
    setIsCollapsing(true)
    // Clear error and success messages
    setError("")
    setSuccess("")
    // Reset timer when editing
    setTimeLeft(0)
    setIsTimerActive(false)
    setIsResendingOTP(false)
    // Wait for animation to complete before hiding the section
    setTimeout(() => {
      setShowOTPSection(false)
      setIsCollapsing(false)
      otpForm.reset()
    }, 800) // Increased animation duration for smoother closing
  }

  return (
    <div className="w-full max-w-[600px] px-4 sm:px-6 md:px-0 h-full flex flex-col items-center">
      {/* Top Section - Logo - Fixed position */}
      <div className="flex justify-center flex-shrink-0 mb-4 sm:mb-6">
        <Image
          src="/images/Logo_Casa Carigar_TERRACOTTA 1.png"
          alt="Logo Casa"
          width={400}
          height={250}
          className="object-contain max-h-[120px] sm:max-h-[150px] md:max-h-[180px] w-auto"
        />
      </div>

      {/* Middle Section - Content - Scrollable if needed */}
      <div className="flex flex-col items-center flex-1 w-full min-w-0 overflow-y-auto min-h-0 pt-2 sm:pt-4 md:pt-[30px] lg:pt-[60px]">
        {/* Text content - Fixed and consistent with guaranteed spacing */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8 w-full max-w-[420px] min-h-[80px] sm:min-h-[100px] md:h-[120px] flex flex-col justify-center flex-shrink-0 px-2">
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-neutral-700 mb-2 sm:mb-3 md:mb-4 font-urbanist text-center leading-tight">
            Access Your <span className="text-primary-600 font-medium font-spectral">Casa Carigar</span> Dashboard
          </p>
          <p className="sm:text-base text-[12px] weight-medium text-neutral-600 font-urbanist text-center">
             Access all your tools in one secure place — from orders to inventory to insights
          </p>
        </div>

        {/* Error Messages */}
        {error && (
          <Alert className="mb-4 max-w-sm border-red-200 bg-red-50 mt-4">
            <AlertDescription className="text-red-800 font-urbanist text-body-3">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Form content */}
        <div className="w-full max-w-sm px-2 sm:px-0">
        {loginMethod === "phone" ? (
          <Form {...mobileForm}>
            <form onSubmit={mobileForm.handleSubmit(handleSendOTP)} className="space-y-3 sm:space-y-4">
              <FormField
                control={mobileForm.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-1">
                      <FormLabel className="text-[13px] sm:text-label-1 weight-medium primary text-neutral-1000 font-urbanist">
                        Phone Number :
                      </FormLabel>
                      {showOTPSection && (
                        <button
                          type="button"
                          className="flex text-[12px] sm:text-label-1 weight-medium gap-1 text-secondary-600 hover:text-secondary-700 font-urbanist sm:text-body-3"
                          onClick={handleEditClick}
                        > 
                          Edit
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <FormDescription className="text-[12px] sm:text-body-3 weight-medium text-neutral-700 font-urbanist mb-1.5 sm:mb-2">
                      Enter mobile number linked with Casa Carigar web portal.
                    </FormDescription>
                    <div className="flex gap-2">
                      <FormControl>
                        <Select
                          value={countryCode}
                          onValueChange={setCountryCode}
                          disabled={true}
                        >
                          <SelectTrigger className="w-[90px] sm:w-[100px] h-10 sm:h-11 border-neutral-300 focus:border-primary-600 focus:ring-primary-600 text-body-2 font-urbanist label-1 weight-medium">
                            <SelectValue placeholder="+91">
                              <span className="flex items-center gap-1">
                                <span>{countryCodes.find(c => c.code === countryCode)?.flag}</span>
                                <span>{countryCode}</span>
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {countryCodes.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                <span className="flex items-center gap-2">
                                  <span>{country.flag}</span>
                                  <span>{country.code}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter your mobile number"
                          {...field}
                          onChange={(e) => {
                            const newValue = formatMobileNumber(e.target.value)
                            field.onChange(newValue)
                          }}
                          className="flex-1 h-10 sm:h-11 border-neutral-300 placeholder:text-[12px] sm:placeholder:text-body-2 focus:border-primary-600 focus:ring-primary-600 text-body-2 font-urbanist label-1 weight-medium"
                          maxLength={10}
                          disabled={showOTPSection}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!showOTPSection && (
                <>
                  <Button
                    type="submit"
                    className="w-full h-10 sm:h-11 bg-secondary-800 !text-white hover:bg-secondary-900 text-[13px] sm:text-label-1 font-medium font-urbanist mt-1.5 sm:mt-2"
                    disabled={isSendingOTP || !mobileForm.formState.isValid}
                  >
                    {isSendingOTP ? "Sending OTP..." : "Send OTP"}
                  </Button>
                  <div className="flex items-center gap-2 my-3 sm:my-4">
                    <div className="flex-1 border-t border-neutral-300"></div>
                    <span className="text-xs sm:text-sm text-neutral-500 font-urbanist">or</span>
                    <div className="flex-1 border-t border-neutral-300"></div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 sm:h-11 border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-[13px] sm:text-label-1 font-medium font-urbanist"
                    onClick={toggleLoginMethod}
                  >
                    Log in using Email
                  </Button>
                  <div className="text-center mt-3 sm:mt-4">
                    <span className="text-xs sm:text-sm text-neutral-500 font-urbanist"> having trouble logging in? </span>
                    <button
                      type="button"
                      className="text-xs sm:text-sm text-secondary-600 hover:text-secondary-700 underline font-urbanist font-medium"
                      onClick={() => setShowForgotPasswordModal(true)}
                    >
                      Forgot Password
                    </button>
                  </div>
                </>
              )}
            </form>
          </Form>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <Form {...emailPasswordForm}>
              <form onSubmit={emailPasswordForm.handleSubmit(handleEmailPasswordLogin)} className="space-y-4 sm:mt-[30px] mt-0 sm:space-y-4">
                <FormField
                  control={emailPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] sm:text-label-1 weight-medium primary text-neutral-1000 font-urbanist">
                        Email Address :
                      </FormLabel>
                      <FormDescription className="text-[12px] sm:text-body-3 weight-medium text-neutral-700 font-urbanist mb-1.5 sm:mb-2">
                        Enter email address linked with Casa Carigar web portal.
                      </FormDescription>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          {...field}
                          className="h-10 sm:h-11 border-neutral-300 placeholder:text-[12px] sm:placeholder:text-body-2 focus:border-primary-600 focus:ring-primary-600 text-body-2 font-urbanist label-1 weight-medium"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailPasswordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] sm:text-label-1 weight-medium primary text-neutral-1000 font-urbanist mb-0.5 sm:mb-1">
                        Password :
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                            className="h-10 sm:h-11 border-neutral-300 placeholder:text-[12px] sm:placeholder:text-body-2 focus:border-primary-600 focus:ring-primary-600 text-body-2 font-urbanist label-1 weight-medium pr-12"
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

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 bg-secondary-800 !text-white hover:bg-secondary-900 text-[13px] sm:text-label-1 font-medium font-urbanist mt-1.5 sm:mt-2"
                  disabled={isLoggingIn || !emailPasswordForm.formState.isValid}
                >
                  {isLoggingIn ? "Logging in..." : "Log in"}
                </Button>
                <div className="flex items-center gap-2 my-3 sm:my-4">
                  <div className="flex-1 border-t border-neutral-300"></div>
                  <span className="text-xs sm:text-sm text-neutral-500 font-urbanist">or</span>
                  <div className="flex-1 border-t border-neutral-300"></div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 sm:h-11 border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-[13px] sm:text-label-1 font-medium font-urbanist"
                  onClick={toggleLoginMethod}
                >
                  Log in using Phone
                </Button>
                <div className="text-center mt-3 sm:mt-4 mb-8">
                  <span className="text-xs sm:text-sm text-neutral-500 font-urbanist"> having trouble logging in? </span>
                  <button
                    type="button"
                    className="text-xs sm:text-sm text-secondary-600 hover:text-secondary-700 underline font-urbanist font-medium"
                    onClick={() => setShowForgotPasswordModal(true)}
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>
            </Form>
          </div>
        )}
        </div>

        {/* Collapsible OTP Section with Animation */}
        {showOTPSection && (
          <div className={`mt-3 sm:mt-4 space-y-3 sm:space-y-4 transition-all duration-700 ease-in-out w-full max-w-sm ${
            isCollapsing 
               ? '' //'animate-out ease-out-to-top-4' 
              : 'animate-in slide-in-from-top-4'
          }`}>
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-3 sm:space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel className="text-[13px] sm:text-label-1 weight-medium primary text-neutral-1000 font-urbanist">
                          Enter OTP :
                        </FormLabel>
                        <button
                          type="button"
                          className={`flex items-center gap-1 font-urbanist text-[12px] sm:text-body-3 ${
                            isTimerActive || isResendingOTP
                              ? "text-neutral-400 cursor-not-allowed" 
                              : "text-secondary-600 hover:text-secondary-700"
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            if (!isTimerActive && !isResendingOTP) {
                              handleResendOTP()
                            }
                          }}
                          disabled={isResendingOTP || isTimerActive}
                        >
                          {isTimerActive ? `Resend in ${timeLeft}s` : isResendingOTP ? "Resending..." : "Resend"}
                          {!isTimerActive && !isResendingOTP && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {/* Individual OTP Input Boxes - 6 boxes */}
                      <div className="flex gap-1.5 sm:gap-2 w-full">
                        {Array.from({ length: 6 }, (_, index) => {
                          const currentOtp = field.value || ""
                          const isBlockActive = index === 0 || (index > 0 && currentOtp[index - 1] !== undefined && currentOtp[index - 1] !== "")
                          const isBlockDisabled = !isBlockActive
                          
                          return (
                            <FormControl key={index}>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={currentOtp[index] || ""}
                                disabled={isBlockDisabled}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "")
                                  if (value.length <= 1) {
                                    const newOtp = currentOtp.split("")
                                    newOtp[index] = value
                                    const updatedOtp = newOtp.join("").slice(0, 6)
                                    field.onChange(updatedOtp)
                                    
                                    // Auto-focus next input if current has value
                                    if (value && index < 5) {
                                      setTimeout(() => {
                                        const nextInput = document.querySelector(`input[data-otp-index="${index + 1}"]`) as HTMLInputElement
                                        nextInput?.focus()
                                      }, 10)
                                    }
                                    
                                    // Auto-submit if all 6 digits are entered
                                    if (updatedOtp.length === 6) {
                                      setTimeout(() => {
                                        otpForm.handleSubmit(handleVerifyOTP)()
                                      }, 100)
                                    }
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Backspace") {
                                    if (!currentOtp[index] && index > 0) {
                                      // Move focus to previous input and clear it
                                      const newOtp = currentOtp.split("")
                                      newOtp[index - 1] = ""
                                      field.onChange(newOtp.join(""))
                                      setTimeout(() => {
                                        const prevInput = document.querySelector(`input[data-otp-index="${index - 1}"]`) as HTMLInputElement
                                        prevInput?.focus()
                                      }, 10)
                                    } else if (currentOtp[index]) {
                                      // Clear current input
                                      const newOtp = currentOtp.split("")
                                      newOtp[index] = ""
                                      field.onChange(newOtp.join(""))
                                    }
                                  } else if (e.key === "ArrowLeft" && index > 0) {
                                    // Move to previous input
                                    setTimeout(() => {
                                      const prevInput = document.querySelector(`input[data-otp-index="${index - 1}"]`) as HTMLInputElement
                                      prevInput?.focus()
                                    }, 10)
                                  } else if (e.key === "ArrowRight" && index < 5 && currentOtp[index]) {
                                    // Move to next input
                                    setTimeout(() => {
                                      const nextInput = document.querySelector(`input[data-otp-index="${index + 1}"]`) as HTMLInputElement
                                      nextInput?.focus()
                                    }, 10)
                                  }
                                }}
                                onPaste={(e) => {
                                  e.preventDefault()
                                  const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
                                  if (pastedData.length > 0) {
                                    field.onChange(pastedData)
                                    // Focus the last filled input or first empty input
                                    const focusIndex = Math.min(pastedData.length - 1, 5)
                                    setTimeout(() => {
                                      const targetInput = document.querySelector(`input[data-otp-index="${focusIndex}"]`) as HTMLInputElement
                                      targetInput?.focus()
                                    }, 10)
                                    
                                    // Auto-submit if all 6 digits are pasted
                                    if (pastedData.length === 6) {
                                      setTimeout(() => {
                                        otpForm.handleSubmit(handleVerifyOTP)()
                                      }, 100)
                                    }
                                  }
                                }}
                                className={`flex-1 h-10 sm:h-12 text-center text-lg sm:text-xl font-bold font-urbanist transition-all duration-200 ${
                                  isBlockDisabled 
                                    ? "border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed" 
                                    : "border-neutral-300 focus:border-primary-600 focus:ring-primary-600 text-neutral-900"
                                }`}
                                data-otp-index={index}
                                autoComplete="one-time-code"
                              />
                            </FormControl>
                          )
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 bg-secondary-800 !text-white hover:bg-secondary-900 text-[13px] sm:text-label-1 font-medium font-urbanist mt-1.5 sm:mt-2"
                  disabled={isVerifyingOTP || !otpForm.formState.isValid}
                >
                  {isVerifyingOTP ? "Verifying..." : "Verify & Log in"}
                </Button>
              </form>
            </Form>
          </div>
        )}

      </div>

      {/* Bottom Section - Footer - Fixed at bottom */}
      <div className="text-center pt-3 sm:pt-4 border-t border-neutral-200 w-full max-w-sm flex-shrink-0 mt-auto px-2 sm:px-0">
        <p className="text-xs sm:text-sm text-neutral-500 font-urbanist">
          Powered by Kuberha AI
        </p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        open={showForgotPasswordModal} 
        onOpenChange={setShowForgotPasswordModal} 
      />
    </div>
  )
}
