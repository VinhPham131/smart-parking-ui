import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/Toast/useToast'
import { authApi } from '../../services/api'
import type { LoginRequest, RegisterRequest } from '../../types/auth'
import type { ApiError } from '../../types/vehicle'
import { getTokenRole, getHomeByRole } from '../../utils/auth'

type AuthMode = 'login' | 'register'

function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        const loginData: LoginRequest = {
          email: formData.email,
          password: formData.password,
          remember_me: rememberMe,
        }
        const response = await authApi.login(loginData)
        if (response.access_token) {
          localStorage.setItem('token', response.access_token)
          if (response.message) {
            toast.success(response.message)
          }
          const role = getTokenRole()
          setTimeout(() => {
            navigate(getHomeByRole(role))
          }, 1000)
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Password confirmation does not match')
          setLoading(false)
          return
        }

        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters long')
          setLoading(false)
          return
        }

        const age = parseInt(formData.age, 10)
        if (isNaN(age) || age < 1 || age > 100) {
          toast.error('Age must be a number between 1 and 100')
          setLoading(false)
          return
        }

        if (!validatePhone(formData.phone)) {
          toast.error('Phone number is not valid')
          setLoading(false)
          return
        }

        const registerData: RegisterRequest = {
          name: formData.name,
          age: age,
          phone: formData.phone,
          address: formData.address,
          email: formData.email,
          password: formData.password,
        }
        const response = await authApi.register(registerData)
        
        if (response.message) {
          toast.success(response.message)
          setMode('login')
          setFormData({ name: '', age: '', phone: '', address: '', email: '', password: '', confirmPassword: '' })
        }
      }
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
        } else if (apiError.message) {
          toast.error(apiError.message)
        } else {
          toast.error('An error occurred')
        }
      } else {
        toast.error(apiError.message || 'An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setRememberMe(false)
    setFormData({ name: '', age: '', phone: '', address: '', email: '', password: '', confirmPassword: '' })
  }

  const openForgotModal = () => {
    setForgotEmail(formData.email)
    setShowForgotModal(true)
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      const response = await authApi.forgotPassword({ email: forgotEmail.trim() })
      if (response.message) {
        toast.success(response.message)
      }
      setShowForgotModal(false)
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message || 'Could not send reset email.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-app-background px-4 py-8 text-white"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      <div className={`relative z-10 w-full space-y-8 ${mode === 'register' ? 'max-w-4xl' : 'max-w-md'}`}>
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-sm text-white/70">
            {mode === 'login'
              ? 'Sign in to continue using the system.'
              : 'Create a new account to get started.'}
          </p>
        </header>

        <div
          className="rounded-3xl border border-white/20
                     bg-white/10 p-6 backdrop-blur-xl
                     shadow-[0_8px_40px_rgba(0,0,0,0.45)]
                     sm:p-8"
        >
          <div className="mb-6 flex gap-2 rounded-full bg-white/10 p-1 text-sm backdrop-blur-md">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-full px-4 py-2 font-medium transition
                ${
                  mode === 'login'
                    ? 'bg-neon-green text-black shadow-lg shadow-neon-green/30'
                    : 'text-white/70 hover:text-white'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 rounded-full px-4 py-2 font-medium transition
                ${
                  mode === 'register'
                    ? 'bg-neon-green text-black shadow-lg shadow-neon-green/30'
                    : 'text-white/70 hover:text-white'
                }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/90">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-white/20
                               bg-white/10 px-3 py-2 text-sm text-white
                               placeholder:text-white/50
                               focus:border-neon-green focus:outline-none
                               focus:ring-2 focus:ring-neon-green/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/90">
                    Age <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    required
                    className="w-full rounded-xl border border-white/20
                               bg-white/10 px-3 py-2 text-sm text-white
                               placeholder:text-white/50
                               focus:border-neon-green focus:outline-none
                               focus:ring-2 focus:ring-neon-green/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/90">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-white/20
                               bg-white/10 px-3 py-2 text-sm text-white
                               placeholder:text-white/50
                               focus:border-neon-green focus:outline-none
                               focus:ring-2 focus:ring-neon-green/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/90">
                    Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-white/20
                               bg-white/10 px-3 py-2 text-sm text-white
                               placeholder:text-white/50
                               focus:border-neon-green focus:outline-none
                               focus:ring-2 focus:ring-neon-green/40"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/90">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-white/20
                           bg-white/10 px-3 py-2 text-sm text-white
                           placeholder:text-white/50
                           focus:border-neon-green focus:outline-none
                           focus:ring-2 focus:ring-neon-green/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/90">
                <span>Password {mode === 'register' && <span className="text-red-400">*</span>}</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={mode === 'register' ? 6 : undefined}
                className="w-full rounded-xl border border-white/20
                           bg-white/10 px-3 py-2 text-sm text-white
                           placeholder:text-white/50
                           focus:border-neon-green focus:outline-none
                           focus:ring-2 focus:ring-neon-green/40"
              />
              {mode === 'register' && (
                <p className="text-xs text-white/60">Password must be at least 6 characters long</p>
              )}
              {mode === 'login' && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-white/85">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-white/30 bg-white/10 text-neon-green accent-neon-green focus:ring-2 focus:ring-neon-green/40"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={openForgotModal}
                    className="text-xs font-medium text-neon-green hover:opacity-80"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/90">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/20
                             bg-white/10 px-3 py-2 text-sm text-white
                             placeholder:text-white/50
                             focus:border-neon-green focus:outline-none
                             focus:ring-2 focus:ring-neon-green/40"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center
                         rounded-xl bg-neon-green px-4 py-2.5
                         text-sm font-semibold text-black
                         shadow-lg shadow-neon-green/30
                         backdrop-blur-sm transition
                         hover:opacity-90
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-white/60">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-medium text-neon-green hover:opacity-80"
            >
              {mode === 'login' ? 'Sign up now' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity"
            aria-label="Close dialog"
            onClick={() => !forgotLoading && setShowForgotModal(false)}
          />
          <div
            className="relative z-10 w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/15
                       bg-linear-to-b from-[#1c2330]/95 via-[#151a24]/98 to-[#0f1218]/98
                       shadow-[0_0_0_1px_rgba(184,255,90,0.06),0_8px_40px_rgba(0,0,0,0.5),0_24px_80px_rgba(0,0,0,0.45)]
                       backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="h-1 w-full bg-linear-to-r from-transparent via-neon-green to-transparent opacity-90"
              aria-hidden
            />
            <div className="relative px-6 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-7">
              <button
                type="button"
                disabled={forgotLoading}
                onClick={() => setShowForgotModal(false)}
                className="absolute right-4 top-5 rounded-lg p-1.5 text-white/50 transition
                           hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col items-center text-center">
                <div
                  className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl
                             bg-neon-green/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
                             ring-1 ring-neon-green/35"
                >
                  <svg
                    className="h-7 w-7 text-neon-green"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neon-green/90">
                  Password recovery
                </p>
                <h2 id="forgot-password-title" className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Reset link to your inbox
                </h2>
                <p className="mt-2.5 max-w-76 text-sm leading-relaxed text-white/55">
                  Enter the email tied to your account. We&apos;ll send a secure link—valid for a few minutes—to choose a new
                  password.
                </p>
              </div>

              <form onSubmit={handleForgotSubmit} className="mt-7 space-y-5">
                <div className="space-y-2 text-left">
                  <label htmlFor="forgot-email" className="text-xs font-medium uppercase tracking-wider text-white/50">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35">
                      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    </span>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/15 bg-black/25 py-3 pl-11 pr-3.5 text-sm text-white
                                 placeholder:text-white/30 shadow-inner shadow-black/20
                                 transition focus:border-neon-green/55 focus:outline-none focus:ring-2 focus:ring-neon-green/25"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3">
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={() => setShowForgotModal(false)}
                    className="w-full rounded-xl border border-white/15 bg-white/4 px-4 py-3 text-sm font-medium
                               text-white/85 transition hover:bg-white/8 disabled:opacity-50 sm:w-auto sm:min-w-30"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-neon-green px-4 py-3 text-sm font-semibold
                               text-black shadow-lg shadow-neon-green/20 transition
                               hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-40"
                  >
                    {forgotLoading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                          />
                        </svg>
                        Send reset link
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthPage
