import { useContext, useMemo } from 'react'
import { ToastContext } from './ToastContext'
import type { ToastType } from './types'

export function useToast() {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  const { showToast } = context

  return useMemo(
    () => ({
      success: (message: string) => showToast(message, 'success'),
      error: (message: string) => showToast(message, 'error'),
      info: (message: string) => showToast(message, 'info'),
      warning: (message: string) => showToast(message, 'warning'),
      show: (message: string, type?: ToastType) => showToast(message, type),
    }),
    [showToast]
  )
}
