import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useToast } from '../../components/Toast/useToast'
import { authApi } from '../../services/api'
import type { ApiError } from '../../types/vehicle'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error('Missing reset token. Open the link from your email.')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Password confirmation does not match')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.resetPassword({ token, password })
      if (res.message) {
        toast.success(res.message)
      }
      localStorage.removeItem('token')
      setTimeout(() => navigate('/login', { replace: true }), 900)
    } catch (err) {
      const apiError = err as ApiError
      toast.error(apiError.message || 'Could not reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-app-background px-4 py-8 text-white"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Reset password</h1>
        </header>

        <div
          className="rounded-3xl border border-white/20
                     bg-white/10 p-6 backdrop-blur-xl
                     shadow-[0_8px_40px_rgba(0,0,0,0.45)]
                     sm:p-8"
        >
          {!token ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-white/75">
                This page needs a valid link from your reset email. Request a new link from the sign-in page.
              </p>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-neon-green px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-neon-green/30"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="reset-password" className="text-sm font-medium text-white/90">
                  New password <span className="text-red-400">*</span>
                </label>
                <input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/20
                             bg-white/10 px-3 py-2 text-sm text-white
                             placeholder:text-white/50
                             focus:border-neon-green focus:outline-none
                             focus:ring-2 focus:ring-neon-green/40"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="reset-password-confirm" className="text-sm font-medium text-white/90">
                  Confirm password <span className="text-red-400">*</span>
                </label>
                <input
                  id="reset-password-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/20
                             bg-white/10 px-3 py-2 text-sm text-white
                             placeholder:text-white/50
                             focus:border-neon-green focus:outline-none
                             focus:ring-2 focus:ring-neon-green/40"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center
                           rounded-xl bg-neon-green px-4 py-2.5
                           text-sm font-semibold text-black
                           shadow-lg shadow-neon-green/30
                           transition hover:opacity-90
                           disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Update password'}
              </button>

              <p className="text-center text-xs text-white/60">
                <Link to="/login" className="font-medium text-neon-green hover:opacity-80">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
