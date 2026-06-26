import { useState } from 'react'
import { useToast } from './Toast/useToast'
import { vehicleApi } from '../services/api'
import type { RegisterVehicleRequest } from '../types/vehicle'
import type { ApiError } from '../types/vehicle'
import { VEHICLE_BRANDS } from '../constants/vehicles'

interface VehicleRegistrationFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function VehicleRegistrationForm({ isOpen, onClose, onSuccess }: VehicleRegistrationFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    license_plate: '',
    brand: '',
    color: ''
  })
  const toast = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }))
  }

  const validateLicensePlate = (plate: string): boolean => {
    const plateRegex = /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,6}$/
    return plateRegex.test(plate)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!validateLicensePlate(formData.license_plate)) {
        toast.error('Invalid license plate. Please enter in the correct format (e.g., 30A-12345)')
        setLoading(false)
        return
      }

      const vehicleData: RegisterVehicleRequest = {
        license_plate: formData.license_plate,
        brand: formData.brand,
        color: formData.color
      }

      const res = await vehicleApi.registerVehicle(vehicleData)
      if (res.message) toast.success(res.message)
      setFormData({ license_plate: '', brand: '', color: ''})
      onSuccess()
      onClose()
    } catch (err) {
      const apiError = err as ApiError
      if (apiError.errors) {
        const allErrors: string[] = []
        Object.values(apiError.errors).forEach((errorArray) => {
          if (Array.isArray(errorArray)) {
            allErrors.push(...errorArray)
          }
        })
        if (allErrors.length > 0) {
          allErrors.forEach((errorMsg) => {
            toast.error(errorMsg)
          })
        } else {
          toast.error(apiError.message)
        }
      } else {
        toast.error(apiError.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({ license_plate: '' , color: '', brand: ''})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/20 bg-sidebar-bg p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute right-4 top-4 text-white/50 transition hover:text-neon-green disabled:opacity-50"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Register New Car</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="license_plate"
              className="block text-sm font-medium text-white/90"
            >
              License Plate <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="license_plate"
              name="license_plate"
              value={formData.license_plate}
              onChange={handleInputChange}
              required
              maxLength={12}
              disabled={loading}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-white/50">(e.g., 30A-12345)</p>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="color"
              className="block text-sm font-medium text-white/90"
            >
              Color <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              required
              maxLength={12}
              disabled={loading}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/40 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="brand"
              className="block text-sm font-medium text-white/90"
            >
              Brand <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.brand}
              onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
              required
              className="w-full rounded-lg bg-white/5 p-3 text-white"
            >
              <option value="">Select brand</option>
              {VEHICLE_BRANDS.map((b) => (
                <option key={b.label} value={b.label}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-neon-green px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Processing...
                </span>
              ) : (
                "Register"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VehicleRegistrationForm
