import { useEffect } from 'react'
import { getAppSocket } from '../services/socket'

export function useSocketEvent<T>(
  event: string,
  handler: (payload: T) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return

    const socket = getAppSocket()
    socket.on(event, handler)

    return () => {
      socket.off(event, handler)
    }
  }, [event, handler, enabled])
}
