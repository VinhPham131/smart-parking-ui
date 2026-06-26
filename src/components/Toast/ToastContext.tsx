import { createContext } from 'react'
import type { ToastMessage, ToastType } from './types'

interface ToastContextType {
  toasts: ToastMessage[]
  showToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

