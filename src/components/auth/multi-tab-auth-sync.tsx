// ============================================================
// Multi-Tab Authentication Synchronization
// Roshani Public School ERP
// ============================================================
'use client'

import { useEffect } from 'react'

export const AUTH_CHANNEL_NAME = 'rps_erp_auth_sync'
export const LOGOUT_STORAGE_KEY = 'rps_erp_logout_event'

/**
 * Broadcasts a logout event to all other open tabs in the browser.
 */
export function broadcastAuthLogout(): void {
  if (typeof window === 'undefined') return

  // 1. BroadcastChannel API
  try {
    if ('BroadcastChannel' in window && typeof window.BroadcastChannel === 'function') {
      const channel = new (window as any).BroadcastChannel(AUTH_CHANNEL_NAME)
      channel.postMessage({ type: 'AUTH_LOGOUT', timestamp: Date.now() })
      channel.close()
    }
  } catch {
    // Non-blocking
  }

  // 2. Storage Event fallback
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOGOUT_STORAGE_KEY, String(Date.now()))
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Component that listens for logout events broadcasted from peer tabs.
 * Mounted in ERPAppShell to ensure instant synchronization.
 */
export function MultiTabAuthSync() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleRemoteLogout = () => {
      window.location.href = '/login?reason=session_ended'
    }

    // 1. BroadcastChannel listener
    let channel: BroadcastChannel | null = null
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel(AUTH_CHANNEL_NAME)
        channel.onmessage = (event) => {
          if (event.data?.type === 'AUTH_LOGOUT') {
            handleRemoteLogout()
          }
        }
      }
    } catch {
      channel = null
    }

    // 2. Storage event listener fallback
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOGOUT_STORAGE_KEY && event.newValue) {
        handleRemoteLogout()
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      if (channel) {
        channel.close()
      }
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return null
}
