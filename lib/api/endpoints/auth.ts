// src/lib/api/endpoints/auth.ts

import { post, ApiError } from "../client"
import { getAccessTokenFromAuth } from "../helpers/auth"
import type { SendOTPResponse } from "@/types/shared"
import type { AuthResponse } from "@/types/domains/auth"
import type { LegacyResponse } from "@/types/shared"

/**
 * sendOTP - no auth required
 */
export async function sendOTP(
  mobile: string
): Promise<LegacyResponse<void>> {
  try {
    const body = { login: mobile, name: "demo" }
    const res = await post<SendOTPResponse>("/sendotp", body, { 
      includeAuth: false,
      skipAuthRedirect: true, // Don't redirect on 401 during login flow
    })

    if (res?.status_code === 200) {
      return { success: true, message: res.message ?? "OTP sent" }
    }
    return { success: false, message: res?.message ?? "Failed to send OTP" }
  } catch (err: unknown) {
    // legacy behaviour: return object, map network errors to friendly message
    if (err instanceof TypeError && typeof window !== "undefined" && (err as Error).message.includes("fetch")) {
      return { success: false, message: "Network error. Please check your internet connection." }
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to send OTP. Please try again.",
    }
  }
}

/**
 * verifyOTP - no auth required
 */
export async function verifyOTP(
  mobile: string,
  otp: string
): Promise<LegacyResponse<AuthResponse>> {
  try {
    const body = { login: mobile, otp: otp, user_type: "seller" }
    const res = await post<any>("/token", body, { 
      includeAuth: false,
      skipAuthRedirect: true, // Don't redirect on 401 during login flow
    })

    if (!res) return { success: false, message: "Empty response from server" }
    if (res.status_code !== 200) {
      return { success: false, message: res.message ?? "Authentication failed" }
    }

    const authData = res.data
    const token = getAccessTokenFromAuth(authData)
    if (!token) return { success: false, message: res.message || "No authentication token received from server" }

    return { success: true, data: authData }
  } catch (err: unknown) {
    if (err instanceof TypeError && typeof window !== "undefined" && (err as Error).message.includes("fetch")) {
      return { success: false, message: "Network error. Please check your internet connection." }
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to verify OTP",
    }
  }
}

/**
 * login - uses text/plain (legacy)
 */
export async function login(
  loginVal: string,
  password: string
): Promise<LegacyResponse<AuthResponse>> {
  try {
    const body = { login: loginVal, password }
    const res = await post<any>("/auth_token", body, {
      includeAuth: false,
      contentType: "text",
      skipAuthRedirect: true, // Don't redirect on 401 during login flow
    })

    if (!res) return { success: false, message: "Empty response from server" }
    if (res.status_code !== 200) {
      return { success: false, message: res.message ?? "Authentication failed" }
    }

    const authData = res.data
    const token = getAccessTokenFromAuth(authData)
    if (!token) return { success: false, message: "No authentication token received from server" }

    return { success: true, data: authData }
  } catch (err: unknown) {
    if (err instanceof TypeError && typeof window !== "undefined" && (err as Error).message.includes("fetch")) {
      return { success: false, message: "Network error. Please check your internet connection." }
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : "Login failed",
    }
  }
}

/**
 * sendChangePassword - sends password reset email
 */
export async function sendChangePassword(
  email: string
): Promise<LegacyResponse<void>> {
  try {
    const body = { email }
    const res = await post<any>("/send_change_password", body, {
      includeAuth: false,
      contentType: "text",
      skipAuthRedirect: true, // Don't redirect on 401 during password reset flow
    })

    if (res?.status_code === 200) {
      return { success: true, message: res.message ?? "Email sent successfully" }
    }
    // Return with status_code to preserve error status for UI handling
    return { status_code: res?.status_code ?? 500, message: res?.message ?? "Failed to send password reset email" }
  } catch (err: unknown) {
    // Handle ApiError to extract status code
    if (err instanceof ApiError) {
      return { status_code: err.status ?? 500, message: err.message || "Failed to send password reset email. Please try again." }
    }
    if (err instanceof TypeError && typeof window !== "undefined" && (err as Error).message.includes("fetch")) {
      return { success: false, message: "Network error. Please check your internet connection." }
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to send password reset email. Please try again.",
    }
  }
}
