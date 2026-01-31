"use client"

import { useCallback, useState, useEffect, useRef } from 'react'

/**
 * Coordinate Transformation Utility for Shop the Look Markers
 * 
 * This hook provides viewport-independent coordinate handling.
 * 
 * Coordinate System:
 * - API stores coordinates as PIXEL values based on NATURAL image dimensions
 * - Internally we work with PERCENTAGE of natural image (0-100)
 * - This ensures coordinates are consistent across all viewports/screens
 * 
 * The Flutter frontend expects:
 * - x_coordinate and y_coordinate as pixel positions on the natural image
 * - Coordinates represent the CENTER of the marker dot
 * - Uses BoxFit.cover for display, so coordinates must be image-relative
 */

export interface NaturalImageDimensions {
  width: number
  height: number
}

export interface ContainTransform {
  // Container dimensions
  containerWidth: number
  containerHeight: number
  // Natural image dimensions
  imageWidth: number
  imageHeight: number
  // Scale factor (how much the image is scaled to fit)
  scale: number
  // Offset from container edge to rendered image edge (letterboxing)
  offsetX: number
  offsetY: number
  // Rendered image dimensions within the container
  renderedWidth: number
  renderedHeight: number
}

export interface PercentageCoordinate {
  x: number // 0-100 percentage of natural image width
  y: number // 0-100 percentage of natural image height
}

export interface PixelCoordinate {
  x: number // Pixel position on natural image
  y: number // Pixel position on natural image
}

export interface UseMarkerCoordinatesOptions {
  imageUrl: string | null
  containerRef: React.RefObject<HTMLDivElement | null>
}

export interface UseMarkerCoordinatesReturn {
  // Natural image dimensions (null if not loaded yet)
  imageDimensions: NaturalImageDimensions | null
  // Whether the image dimensions are loaded and ready
  isReady: boolean
  // Get the contain transform for coordinate mapping
  getContainTransform: () => ContainTransform | null
  // Convert container pixel position to percentage of natural image
  containerToPercentage: (containerX: number, containerY: number) => PercentageCoordinate | null
  // Convert percentage of natural image to container pixel position
  percentageToContainer: (percentX: number, percentY: number) => { left: number; top: number } | null
  // Convert percentage to pixel coordinates for API
  percentageToPixels: (percentX: number, percentY: number) => PixelCoordinate
  // Convert pixel coordinates from API to percentage
  pixelsToPercentage: (pixelX: number, pixelY: number) => PercentageCoordinate
  // Clamp percentage coordinates to keep marker within image bounds
  clampPercentage: (percentX: number, percentY: number, markerRadiusPx?: number) => PercentageCoordinate
}

/**
 * Hook for handling marker coordinate transformations
 * Ensures coordinates are viewport-independent and work across different screen sizes
 */
export function useMarkerCoordinates({
  imageUrl,
  containerRef,
}: UseMarkerCoordinatesOptions): UseMarkerCoordinatesReturn {
  const [imageDimensions, setImageDimensions] = useState<NaturalImageDimensions | null>(null)
  const [isReady, setIsReady] = useState(false)
  
  // Cache the loaded image to avoid reloading
  const loadedImageRef = useRef<string | null>(null)

  // Load natural image dimensions
  useEffect(() => {
    if (!imageUrl) {
      setImageDimensions(null)
      setIsReady(false)
      return
    }

    // Don't reload if it's the same image
    if (loadedImageRef.current === imageUrl && imageDimensions) {
      return
    }

    const img = new window.Image()
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
      loadedImageRef.current = imageUrl
      setIsReady(true)
    }
    img.onerror = () => {
      console.error('Failed to load image for dimension calculation:', imageUrl)
      setImageDimensions(null)
      setIsReady(false)
    }
    img.src = imageUrl
  }, [imageUrl])

  /**
   * Calculate the contain transform for object-fit: contain
   * This maps between container coordinates and natural image coordinates
   */
  const getContainTransform = useCallback((): ContainTransform | null => {
    if (!containerRef.current || !imageDimensions) {
      return null
    }

    const rect = containerRef.current.getBoundingClientRect()
    const containerWidth = rect.width
    const containerHeight = rect.height
    const imageWidth = imageDimensions.width
    const imageHeight = imageDimensions.height

    if (!containerWidth || !containerHeight || !imageWidth || !imageHeight) {
      return null
    }

    // object-contain: scale to fit entirely within container (no cropping)
    const scale = Math.min(containerWidth / imageWidth, containerHeight / imageHeight)
    const renderedWidth = imageWidth * scale
    const renderedHeight = imageHeight * scale
    // Centered within container
    const offsetX = (containerWidth - renderedWidth) / 2
    const offsetY = (containerHeight - renderedHeight) / 2

    return {
      containerWidth,
      containerHeight,
      imageWidth,
      imageHeight,
      scale,
      offsetX,
      offsetY,
      renderedWidth,
      renderedHeight,
    }
  }, [containerRef, imageDimensions])

  /**
   * Convert a position in container coordinates (e.g., from mouse event)
   * to percentage of the natural image
   */
  const containerToPercentage = useCallback((
    containerX: number,
    containerY: number
  ): PercentageCoordinate | null => {
    const transform = getContainTransform()
    if (!transform) return null

    const { offsetX, offsetY, scale, imageWidth, imageHeight } = transform

    // Convert container position to position on the rendered image
    const xOnRendered = containerX - offsetX
    const yOnRendered = containerY - offsetY

    // Convert to natural image pixels
    const xOnNatural = xOnRendered / scale
    const yOnNatural = yOnRendered / scale

    // Convert to percentage of natural image
    const xPercent = (xOnNatural / imageWidth) * 100
    const yPercent = (yOnNatural / imageHeight) * 100

    return { x: xPercent, y: yPercent }
  }, [getContainTransform])

  /**
   * Convert percentage of natural image to container position (for rendering markers)
   * Returns position in container percentage (0-100)
   */
  const percentageToContainer = useCallback((
    percentX: number,
    percentY: number
  ): { left: number; top: number } | null => {
    const transform = getContainTransform()
    if (!transform) return null

    const { 
      offsetX, 
      offsetY, 
      scale, 
      imageWidth, 
      imageHeight, 
      containerWidth, 
      containerHeight 
    } = transform

    // Convert percentage to natural image pixels
    const xOnNatural = (percentX / 100) * imageWidth
    const yOnNatural = (percentY / 100) * imageHeight

    // Convert to rendered image position
    const xOnRendered = xOnNatural * scale
    const yOnRendered = yOnNatural * scale

    // Add offset for letterboxing, then convert to container percentage
    const xInContainer = offsetX + xOnRendered
    const yInContainer = offsetY + yOnRendered

    const leftPercent = (xInContainer / containerWidth) * 100
    const topPercent = (yInContainer / containerHeight) * 100

    return { left: leftPercent, top: topPercent }
  }, [getContainTransform])

  /**
   * Convert percentage coordinates to pixel coordinates for the API
   * This is what gets sent to the backend
   */
  const percentageToPixels = useCallback((
    percentX: number,
    percentY: number
  ): PixelCoordinate => {
    if (!imageDimensions) {
      console.warn('Image dimensions not loaded, using default dimensions')
      // This should not happen if isReady is checked before saving
      return { x: 0, y: 0 }
    }

    // Round to whole pixels for consistency
    const x = Math.round((percentX / 100) * imageDimensions.width)
    const y = Math.round((percentY / 100) * imageDimensions.height)

    return { x, y }
  }, [imageDimensions])

  /**
   * Convert pixel coordinates from the API to percentage
   * This is used when loading existing markers
   */
  const pixelsToPercentage = useCallback((
    pixelX: number,
    pixelY: number
  ): PercentageCoordinate => {
    if (!imageDimensions) {
      console.warn('Image dimensions not loaded, using default dimensions')
      return { x: 0, y: 0 }
    }

    const x = (pixelX / imageDimensions.width) * 100
    const y = (pixelY / imageDimensions.height) * 100

    return { x, y }
  }, [imageDimensions])

  /**
   * Clamp percentage coordinates to keep the marker dot within image bounds
   * Takes into account the marker's visual radius
   */
  const clampPercentage = useCallback((
    percentX: number,
    percentY: number,
    markerRadiusPx: number = 16 // Default: half of 32px marker
  ): PercentageCoordinate => {
    const transform = getContainTransform()
    if (!transform) {
      // If no transform available, just clamp to 0-100
      return {
        x: Math.max(0, Math.min(100, percentX)),
        y: Math.max(0, Math.min(100, percentY)),
      }
    }

    const { scale, imageWidth, imageHeight } = transform

    // Convert marker radius from container pixels to percentage of natural image
    const markerRadiusXPercent = (markerRadiusPx / (scale * imageWidth)) * 100
    const markerRadiusYPercent = (markerRadiusPx / (scale * imageHeight)) * 100

    // Clamp so the marker center stays far enough from edges
    const x = Math.max(markerRadiusXPercent, Math.min(100 - markerRadiusXPercent, percentX))
    const y = Math.max(markerRadiusYPercent, Math.min(100 - markerRadiusYPercent, percentY))

    return { x, y }
  }, [getContainTransform])

  return {
    imageDimensions,
    isReady,
    getContainTransform,
    containerToPercentage,
    percentageToContainer,
    percentageToPixels,
    pixelsToPercentage,
    clampPercentage,
  }
}

/**
 * Utility function to check if two markers would overlap
 * @param marker1 - First marker coordinates (percentage)
 * @param marker2 - Second marker coordinates (percentage)
 * @param minDistance - Minimum distance between marker centers (percentage)
 */
export function checkMarkerOverlap(
  marker1: PercentageCoordinate,
  marker2: PercentageCoordinate,
  minDistance: number = 5 // Default 5% of image dimension
): boolean {
  const distance = Math.sqrt(
    Math.pow(marker1.x - marker2.x, 2) + Math.pow(marker1.y - marker2.y, 2)
  )
  return distance < minDistance
}

/**
 * Calculate the minimum distance threshold for marker overlap detection
 * Based on marker size and current scale
 */
export function calculateMinDistance(
  markerRadiusPx: number,
  transform: ContainTransform | null
): number {
  if (!transform) return 5 // Default fallback

  const { scale, imageWidth, imageHeight } = transform
  const markerRadiusXPercent = (markerRadiusPx / (scale * imageWidth)) * 100
  const markerRadiusYPercent = (markerRadiusPx / (scale * imageHeight)) * 100

  // Minimum distance should be at least 2x the larger radius percentage
  return Math.max(3.0, Math.max(markerRadiusXPercent, markerRadiusYPercent) * 2.5)
}

