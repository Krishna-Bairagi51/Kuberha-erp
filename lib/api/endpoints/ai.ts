// src/lib/api/endpoints/ai.ts

import { postForm, get } from "../client"
import { getUserIdForAI } from "../helpers/auth"
import { wrapAndThrow } from "../error"
import type { UploadTransformResponse, TaskStatusResponse } from "@/types/domains/ai"

// AI base URL (different from main BASE_URL)
const BASE_AI_FEATURE_URL = process.env.NEXT_PUBLIC_AI_URL || ""

/**  
 * uploadAndTransform(file)
 * - legacy behavior preserved (POST multipart/form-data)
 * - uses postForm() since backend expects FormData
 * - returns UploadTransformResponse identical to old code
 * - rethrows as ApiError via wrapAndThrow for canonical error shape
 */
export async function uploadAndTransform(file: File): Promise<UploadTransformResponse> {
  try {
    const userId = getUserIdForAI()

    const form = new FormData()
    form.append("file", file, file.name)
    form.append("user_id", userId)

    // Note: using full URL directly because this API uses a different domain
    const url = `${BASE_AI_FEATURE_URL}/upload-and-transform?chunk_size=50`

    const response = await postForm<UploadTransformResponse>(
      url,
      form,
      { includeAuth: false } // same as legacy: no token sent
    )

    return response
  } catch (err: unknown) {
    wrapAndThrow(err)
  }
}

/**
 * getTaskStatus(taskId)
 * - legacy GET call preserved
 * - returns TaskStatusResponse exactly like old version
 * - rethrows as ApiError via wrapAndThrow for canonical error shape
 */
export async function getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  try {
    const url = `${BASE_AI_FEATURE_URL}/task/${taskId}`

    // This endpoint returns JSON, so a normal GET works
    const response = await get<TaskStatusResponse>(
      url,
      undefined,
      { includeAuth: false } // legacy did not include tokens
    )

    return response
  } catch (err: unknown) {
    wrapAndThrow(err)
  }
}

/**
 * generateProductDescription
 * - Calls Next.js API route /api/generate-description
 * - This route handles Gemini AI calls server-side (keeps API key secure)
 * - Accepts FormData with image and product details
 * - Returns generated description
 */
export interface GenerateDescriptionRequest {
  image: File
  name?: string
  category?: string
  price?: string
  color?: string
  material?: string
  dimensions?: string
  features?: string
  additional_info?: string
}

export interface GenerateDescriptionResponse {
  description: string
  product_name?: string
}

export async function generateProductDescription(
  data: GenerateDescriptionRequest
): Promise<GenerateDescriptionResponse> {
  try {
    const formData = new FormData()
    formData.append("image", data.image)
    
    if (data.name) formData.append("name", data.name)
    if (data.category) formData.append("category", data.category)
    if (data.price) formData.append("price", data.price)
    if (data.color) formData.append("color", data.color)
    if (data.material) formData.append("material", data.material)
    if (data.dimensions) formData.append("dimensions", data.dimensions)
    if (data.features) formData.append("features", data.features)
    if (data.additional_info) formData.append("additional_info", data.additional_info)

    // Call Next.js API route (runs on server, keeps API key secure)
    const response = await fetch("/api/generate-description", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }))
      throw new Error(errorData.detail || `Failed to generate description: ${response.status}`)
    }

    const result: GenerateDescriptionResponse = await response.json()
    return result
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err
    }
    throw new Error("Failed to generate product description. Please try again.")
  }
}
