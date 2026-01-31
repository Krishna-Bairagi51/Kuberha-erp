"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { getUid, getAuthData } from '@/lib/api/helpers/auth'
import type { 
  NotificationMessage, 
  UseNotificationWebSocketOptions 
} from '../types/notification.types'

const SERVER_URL = process.env.NEXT_PUBLIC_WS_URL || "https://casa.ws.kuberha.ai/"

export function useNotificationWebSocket(options: UseNotificationWebSocketOptions = {}) {
  const {
    enabled = true,
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const shouldReconnectRef = useRef(true)
  const isManualCloseRef = useRef(false)
  
  // Use refs for callbacks to prevent unnecessary re-renders
  const onMessageRef = useRef(onMessage)
  const onErrorRef = useRef(onError)
  const onOpenRef = useRef(onOpen)
  const onCloseRef = useRef(onClose)
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage
    onErrorRef.current = onError
    onOpenRef.current = onOpen
    onCloseRef.current = onClose
  }, [onMessage, onError, onOpen, onClose])

  // Build WebSocket URL with user info
  const buildWebSocketUrl = useCallback(() => {
    const uid = getUid()
    const authData = getAuthData()
    const username = authData?.name || 'user'
    const room = `room-${uid || 'unknown'}`
    
    return `${SERVER_URL}/?room=${room}&name=${encodeURIComponent(username)}`
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Don't connect if disabled or already connected/connecting
    if (!enabled) {
      //console.log('[Notification WebSocket] ⚠️ Connection disabled, skipping connect')
      return
    }

    // Check if already connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      //console.log('[Notification WebSocket] ✅ Already connected, skipping connect')
      return
    }

    // Check if already connecting
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      //console.log('[Notification WebSocket] ⏳ Already connecting, skipping connect')
      return
    }

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Check if we've exceeded max reconnect attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      //console.log('[Notification WebSocket] ❌ Max reconnect attempts reached, stopping')
      setConnectionStatus('disconnected')
      return
    }

    // Close existing connection if any (only if not connecting)
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CONNECTING) {
      //console.log('[Notification WebSocket] 🔄 Closing existing connection before new connection')
      wsRef.current.close()
      wsRef.current = null
    }

    const url = buildWebSocketUrl()
    //console.log('[Notification WebSocket] 🔌 Attempting to connect', { url, reconnectAttempt: reconnectAttemptsRef.current })
    setConnectionStatus('connecting')

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws
      //console.log('[Notification WebSocket] 📡 WebSocket instance created', { readyState: ws.readyState })

      ws.onopen = () => {
        //console.log('[Notification WebSocket] ✅ WebSocket connection opened successfully')
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0 // Reset on successful connection
        onOpenRef.current?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
          //console.log('[Notification WebSocket] 🔔 Webhook/WebSocket Message Received', { data })
          onMessageRef.current?.(data)
        } catch (error) {
          // Still call onMessage with raw data if parsing fails
          //console.log('[Notification WebSocket] 🔔 Webhook/WebSocket Message Received (Raw)', { message: event.data, error })
          onMessageRef.current?.({ message: event.data, raw: true })
        }
      }

      ws.onerror = (error) => {
        //console.error('[Notification WebSocket] ❌ WebSocket error', { error, readyState: ws.readyState })
        setConnectionStatus('disconnected')
        setIsConnected(false)
        onErrorRef.current?.(error)
      }

      ws.onclose = (event) => {
        //console.log('[Notification WebSocket] 🔌 WebSocket closed', { 
            // code: event.code, 
            // reason: event.reason, 
            // wasClean: event.wasClean,
            // isManualClose: isManualCloseRef.current,
            // shouldReconnect: shouldReconnectRef.current,
            // enabled,
            // reconnectAttempt: reconnectAttemptsRef.current
          //})
        setIsConnected(false)
        setConnectionStatus('disconnected')
        onCloseRef.current?.()

        // Only reconnect if it wasn't a manual close and we should reconnect
        if (!isManualCloseRef.current && shouldReconnectRef.current && enabled) {
          // Check if we should attempt reconnection
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current += 1
            const delay = reconnectInterval * reconnectAttemptsRef.current // Exponential backoff
            
            setConnectionStatus('reconnecting')
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect()
            }, delay)
          } else {
            setConnectionStatus('disconnected')
          }
        }
      }
    } catch (error) {
      //console.error('[Notification WebSocket] ❌ Error creating WebSocket connection', { error })
      setConnectionStatus('disconnected')
      setIsConnected(false)
    }
  }, [enabled, buildWebSocketUrl, reconnectInterval, maxReconnectAttempts])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    isManualCloseRef.current = true
    shouldReconnectRef.current = false

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
    setConnectionStatus('disconnected')
    reconnectAttemptsRef.current = 0
  }, [])

  // Send message through WebSocket
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message)
      wsRef.current.send(data)
      return true
    } else {
      //console.warn('[WebSocket] ⚠️ Cannot send message - WebSocket not connected. State:', wsRef.current?.readyState)
      return false
    }
  }, [])

  // Initialize connection on mount
  useEffect(() => {
    //console.log('[Notification WebSocket] 🎬 useEffect triggered', { enabled, readyState: wsRef.current?.readyState })
    if (enabled) {
      isManualCloseRef.current = false
      shouldReconnectRef.current = true
      connect()
    }

    // Cleanup on unmount
    return () => {
      //console.log('[Notification WebSocket] 🧹 useEffect cleanup - closing connection')
      isManualCloseRef.current = true
      shouldReconnectRef.current = false

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (wsRef.current) {
        const readyState = wsRef.current.readyState
        //console.log('[Notification WebSocket] 🧹 Closing WebSocket in cleanup', { readyState })
        wsRef.current.close()
        wsRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]) // Only depend on enabled, not connect to avoid re-running

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    reconnectAttempts: reconnectAttemptsRef.current,
  }
}

