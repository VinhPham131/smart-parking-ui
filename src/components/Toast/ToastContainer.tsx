import { useContext } from 'react'
import { ToastContext } from './ToastContext'

const CheckIcon = () => (
  <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11.917 9.724 16.5 19 7.5"/>
  </svg>
)

const XIcon = () => (
  <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6"/>
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6"/>
  </svg>
)

const WarningIcon = () => (
  <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
  </svg>
)

const InfoIcon = () => (
  <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
  </svg>
)

const getIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckIcon />
    case 'error':
      return <XIcon />
    case 'warning':
      return <WarningIcon />
    case 'info':
    default:
      return <InfoIcon />
  }
}

const getIconStyles = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-500 text-white border-green-600 shadow-lg'
    case 'error':
      return 'bg-red-500 text-white border-red-600 shadow-lg'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'info':
    default:
      return 'bg-blue-100 text-blue-800 border-blue-300'
  }
}

const getBackgroundStyles = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-200 border-green-200'
    case 'error':
      return 'bg-red-200 border-red-200'
    case 'warning':
      return 'bg-yellow-200 border-yellow-200'
    case 'info':
    default:
      return 'bg-blue-200 border-blue-200'
  }
}

const getMessageStyles = (type: string) => {
  switch (type) {
    case 'success':
      return 'text-green-700'
    case 'error':
      return 'text-red-700'
    case 'warning':
      return 'text-yellow-700'
    case 'info':
    default:
      return 'text-blue-700'
  }
}

export function ToastContainer() {
  const context = useContext(ToastContext)
  
  if (!context) {
    return null
  }

  const { toasts, removeToast } = context

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2 flex flex-col items-center">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          id={`toast-${toast.type}`}
          className={`flex items-center w-full max-w-sm p-4 rounded-lg shadow-sm border ${getBackgroundStyles(toast.type)}`}
          role="alert"
        >
          <div className={`inline-flex items-center justify-center shrink-0 w-7 h-7 ${getIconStyles(toast.type)} rounded`}>
            {getIcon(toast.type)}
            <span className="sr-only">
              {toast.type === 'success' && 'Check icon'}
              {toast.type === 'error' && 'Error icon'}
              {toast.type === 'warning' && 'Warning icon'}
              {toast.type === 'info' && 'Info icon'}
            </span>
          </div>
          <div className={`ms-3 text-sm font-normal ${getMessageStyles(toast.type)}`}>{toast.message}</div>
          <button
            type="button"
            className="ms-auto flex items-center justify-center text-gray-500 hover:text-gray-700 bg-transparent box-border border border-transparent hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium leading-5 rounded text-sm h-8 w-8 focus:outline-none transition-colors"
            onClick={() => removeToast(toast.id)}
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  )
}
