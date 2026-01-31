// app/forgot-password/api.ts
// API functions for password reset

import { post, ApiError } from "@/lib/api/client"
import type { LegacyResponse } from "@/types/shared"

export interface UpdatePasswordRequest {
  email: string
  password: string
  token: string
}

export interface UpdatePasswordResponse {
  message: string
  errors: string[]
  status_code: number
}

/**
 * updatePassword - updates user password
 * Uses text/plain content type as per backend API specification
 */
export async function updatePassword(
  email: string,
  password: string,
  token: string
): Promise<LegacyResponse<UpdatePasswordResponse>> {
  try {
    const body: UpdatePasswordRequest = {
      email,
      password,
      token,
    }
    
    const res = await post<UpdatePasswordResponse>("/update_password", body, {
      includeAuth: false,
      contentType: "text",
      skipAuthRedirect: true, // Don't redirect on 401 during password reset flow
    })

    if (!res) return { success: false, message: "Empty response from server" }
    if (res.status_code !== 200) {
      return { 
        status_code: res.status_code,
        message: res.message ?? "Failed to update password"
      }
    }

    return { 
      success: true, 
      message: res.message ?? "Password Updated Successfully.",
      data: res,
      status_code: res.status_code
    }
  } catch (err: unknown) {
    // Handle ApiError to extract status code
    if (err instanceof ApiError) {
      const status = err.status ?? 500
      return { 
        status_code: status,
        message: err.message || "Failed to update password. Please try again."
      }
    }
    if (err instanceof TypeError && typeof window !== "undefined" && (err as Error).message.includes("fetch")) {
      return { success: false, message: "Network error. Please check your internet connection." }
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update password. Please try again.",
    }
  }
}

