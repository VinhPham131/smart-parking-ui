import { useRef, useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { useToast } from '../../components/Toast/useToast'
import { parkingApi } from '../../services/api'
import type { ApiError } from '../../types/vehicle'

function AdminScanPage() {
  const toast = useToast()
  const [verifying, setVerifying] = useState(false)
  const [isScanning, setIsScanning] = useState(true)
  const lastScannedToken = useRef<string>('')

  const handleVerifyQR = async (token: string) => {
    if (!token.trim() || token.trim() === lastScannedToken.current) {
      return
    }

    lastScannedToken.current = token.trim()
    setVerifying(true)
    setIsScanning(false)

    try {
      const result = await parkingApi.processParking(token.trim())
      toast.success(result.message)
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message)
    } finally {
      setVerifying(false)
      setTimeout(() => {
        setIsScanning(true)
        lastScannedToken.current = ''
      }, 2000)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-sidebar-bg/90 p-6 shadow-xl backdrop-blur-md">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white">Scan QR Code</h2>
        <p className="mt-2 text-sm text-white/60">
          Camera is active. Point at a QR code to scan.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-black">
        {isScanning ? (
          <Scanner
            onScan={(detectedCodes) => {
              if (detectedCodes && detectedCodes.length > 0 && !verifying) {
                const qrData = detectedCodes[0].rawValue
                if (qrData) {
                  handleVerifyQR(qrData)
                }
              }
            }}
            onError={(error) => {
              console.error('QR Scanner error:', error)
            }}
            styles={{
              container: {
                width: '100%',
                height: '500px',
              },
              video: {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              },
            }}
          />
        ) : (
          <div className="flex h-[400px] items-center justify-center bg-black">
            <div className="text-center text-white">
              <svg
                className="mx-auto mb-4 h-12 w-12 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p>Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminScanPage

