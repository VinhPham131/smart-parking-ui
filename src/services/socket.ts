import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL } from '../constants/api'

function getSocketBaseUrl(apiBaseUrl: string): string {
  try {
    const u = new URL(apiBaseUrl)
    // If API lives under a path (e.g. /api), Socket.IO typically mounts at the server root.
    u.pathname = '/'
    u.search = ''
    u.hash = ''
    return u.toString().replace(/\/$/, '')
  } catch {
    return apiBaseUrl.replace(/\/$/, '')
  }
}

let socketSingleton: Socket | null = null

export function getAppSocket(): Socket {
  if (socketSingleton) return socketSingleton

  const baseUrl = getSocketBaseUrl(API_BASE_URL)
  const token = localStorage.getItem('token')

  socketSingleton = io(baseUrl, {
    transports: ['websocket'],
    auth: token ? { token } : undefined,
    autoConnect: true,
  })

  return socketSingleton
}

/**
 * Disconnect and destroy the current socket singleton.
 * Call this on logout so the next getAppSocket() reconnects with a fresh token.
 */
export function resetAppSocket(): void {
  if (socketSingleton) {
    socketSingleton.disconnect()
    socketSingleton = null
  }
}

