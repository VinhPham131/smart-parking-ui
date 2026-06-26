import { useCallback, useEffect, useRef, useState } from 'react'
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCake,
  HiOutlinePencil,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi'
import { useToast } from '../../components/Toast/useToast'
import { userApi } from '../../services/api'
import type { UpdateMyProfileRequest, ChangePasswordRequest } from '../../services/userApi'
import type { UserProfileResponse, ApiError } from '../../types/vehicle'

interface FieldRowProps {
  icon: React.ReactNode
  label: string
  value: string | number
  editing: boolean
  inputValue: string | number
  onInputChange: (v: string) => void
  type?: string
  placeholder?: string
}

function FieldRow({ icon, label, value, editing, inputValue, onInputChange, type = 'text', placeholder }: FieldRowProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition-colors hover:border-white/20">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neon-green/15 text-neon-green">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs font-medium uppercase tracking-widest text-white/40">{label}</p>
        {editing ? (
          <input
            type={type}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={placeholder ?? String(value)}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none ring-0 transition focus:border-neon-green/60 focus:bg-white/15"
          />
        ) : (
          <p className="truncate text-sm font-medium text-white">{value || <span className="text-white/30">—</span>}</p>
        )}
      </div>
    </div>
  )
}

type ActiveSection = 'info' | 'password'

export default function MyProfilePage() {
  const toast = useToast()
  const hasFetchedRef = useRef(false)

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<ActiveSection>('info')

  // Profile edit state
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', age: '', phone: '', address: '' })

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const data = await userApi.getUserProfile()
      setProfile(data)
      setForm({
        name: data.name ?? '',
        age: String(data.age ?? ''),
        phone: data.phone ?? '',
        address: data.address ?? '',
      })
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchProfile()
    }
  }, [fetchProfile])

  const handleEditToggle = () => {
    if (!profile) return
    setEditing(true)
    setForm({
      name: profile.name ?? '',
      age: String(profile.age ?? ''),
      phone: profile.phone ?? '',
      address: profile.address ?? '',
    })
  }

  const handleCancelEdit = () => {
    setEditing(false)
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const payload: UpdateMyProfileRequest = {}
      if (form.name.trim()) payload.name = form.name.trim()
      if (form.age) payload.age = Number(form.age)
      if (form.phone.trim()) payload.phone = form.phone.trim()
      if (form.address.trim()) payload.address = form.address.trim()

      const updated = await userApi.updateMyProfile(payload)
      setProfile(updated)
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    setPwSaving(true)
    try {
      const payload: ChangePasswordRequest = {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }
      await userApi.changePassword(payload)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password changed successfully')
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message || 'Failed to change password')
    } finally {
      setPwSaving(false)
    }
  }

  const avatarLetter = profile?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="container mx-auto flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-8 pt-1">
      <header className="mb-5 shrink-0">
        <h1 className="text-[20px] font-medium uppercase tracking-[0.2em] text-neon-green">
          My Profile
        </h1>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-green border-t-transparent" />
        </div>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Left — avatar + nav */}
          <aside className="flex flex-col gap-4">
            {/* Avatar card */}
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-sidebar-bg/90 p-6 shadow-xl backdrop-blur-md">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neon-green/20 text-4xl font-bold text-neon-green ring-2 ring-neon-green/30">
                {avatarLetter}
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-white">{profile?.name}</p>
                <p className="mt-0.5 text-xs text-white/40">{profile?.email}</p>
              </div>
            </div>

            {/* Section tabs */}
            <nav className="overflow-hidden rounded-2xl border border-white/10 bg-sidebar-bg/90 shadow-xl backdrop-blur-md">
              <button
                type="button"
                onClick={() => setActiveSection('info')}
                className={`flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all ${
                  activeSection === 'info'
                    ? 'bg-neon-green/15 text-neon-green'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <HiOutlineUser className="h-4 w-4 shrink-0" />
                Personal Info
              </button>
              <div className="mx-4 border-t border-white/10" />
              <button
                type="button"
                onClick={() => setActiveSection('password')}
                className={`flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all ${
                  activeSection === 'password'
                    ? 'bg-neon-green/15 text-neon-green'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <HiOutlineLockClosed className="h-4 w-4 shrink-0" />
                Change Password
              </button>
            </nav>
          </aside>

          {/* Right — content */}
          <div className="min-w-0 rounded-2xl border border-white/10 bg-sidebar-bg/90 p-6 shadow-xl backdrop-blur-md">
            {activeSection === 'info' && (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
                    Personal Information
                  </p>
                  {!editing ? (
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-1.5 text-sm font-medium text-white/70 transition hover:border-neon-green/40 hover:text-neon-green"
                    >
                      <HiOutlinePencil className="h-4 w-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-1.5 text-sm font-medium text-white/60 transition hover:border-white/40 hover:text-white disabled:opacity-50"
                      >
                        <HiOutlineX className="h-4 w-4" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-xl bg-neon-green px-4 py-1.5 text-sm font-semibold text-black shadow-md transition hover:opacity-90 hover:shadow-neon-green/30 disabled:opacity-60"
                      >
                        {saving ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                        ) : (
                          <HiOutlineCheck className="h-4 w-4" />
                        )}
                        Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Email — read-only */}
                  <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neon-green/15 text-neon-green">
                      <HiOutlineMail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-xs font-medium uppercase tracking-widest text-white/40">Email</p>
                      <p className="truncate text-sm font-medium text-white/60">{profile?.email}</p>
                    </div>
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                      Read-only
                    </span>
                  </div>

                  <FieldRow
                    icon={<HiOutlineUser className="h-5 w-5" />}
                    label="Full Name"
                    value={profile?.name ?? ''}
                    editing={editing}
                    inputValue={form.name}
                    onInputChange={(v) => setForm((f) => ({ ...f, name: v }))}
                    placeholder="Enter your full name"
                  />
                  <FieldRow
                    icon={<HiOutlineCake className="h-5 w-5" />}
                    label="Age"
                    value={profile?.age ?? ''}
                    editing={editing}
                    inputValue={form.age}
                    onInputChange={(v) => setForm((f) => ({ ...f, age: v }))}
                    type="number"
                    placeholder="Enter your age"
                  />
                  <FieldRow
                    icon={<HiOutlinePhone className="h-5 w-5" />}
                    label="Phone"
                    value={profile?.phone ?? ''}
                    editing={editing}
                    inputValue={form.phone}
                    onInputChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                    placeholder="Enter your phone number"
                  />
                  <FieldRow
                    icon={<HiOutlineLocationMarker className="h-5 w-5" />}
                    label="Address"
                    value={profile?.address ?? ''}
                    editing={editing}
                    inputValue={form.address}
                    onInputChange={(v) => setForm((f) => ({ ...f, address: v }))}
                    placeholder="Enter your address"
                  />
                </div>
              </>
            )}

            {activeSection === 'password' && (
              <>
                <div className="mb-5">
                  <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
                    Change Password
                  </p>
                  <p className="mt-1 text-xs text-white/30">Your new password must be at least 6 characters long.</p>
                </div>

                <div className="max-w-md space-y-4">
                  {/* Current password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-white/40">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                        className="w-full rounded-xl border border-white/20 bg-white/5 py-3 pl-4 pr-11 text-sm text-white placeholder-white/30 outline-none transition focus:border-neon-green/60 focus:bg-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white/70"
                      >
                        {showCurrent ? <HiOutlineEyeOff className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-white/40">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        className="w-full rounded-xl border border-white/20 bg-white/5 py-3 pl-4 pr-11 text-sm text-white placeholder-white/30 outline-none transition focus:border-neon-green/60 focus:bg-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white/70"
                      >
                        {showNew ? <HiOutlineEyeOff className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-white/40">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={pwForm.confirmPassword}
                        onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="w-full rounded-xl border border-white/20 bg-white/5 py-3 pl-4 pr-11 text-sm text-white placeholder-white/30 outline-none transition focus:border-neon-green/60 focus:bg-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white/70"
                      >
                        {showConfirm ? <HiOutlineEyeOff className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {pwForm.newPassword && pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                    <p className="text-xs text-red-400">Passwords do not match</p>
                  )}

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={
                      pwSaving ||
                      !pwForm.currentPassword ||
                      !pwForm.newPassword ||
                      !pwForm.confirmPassword ||
                      pwForm.newPassword !== pwForm.confirmPassword
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-neon-green py-3 text-sm font-semibold text-black shadow-md transition hover:opacity-90 hover:shadow-neon-green/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pwSaving ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    ) : (
                      <HiOutlineLockClosed className="h-4 w-4" />
                    )}
                    {pwSaving ? 'Saving…' : 'Change Password'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
