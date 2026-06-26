import { useCallback, useEffect, useRef, useState } from 'react'
import {
  HiOutlineCreditCard,
  HiOutlineQrcode,
  HiOutlineClipboardList,
  HiOutlineStar,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClipboard,
  HiOutlineRefresh,
  HiOutlineChevronRight,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlinePlusSm,
  HiOutlineCash,
  HiOutlineReply,
} from 'react-icons/hi'
import { useToast } from '../../components/Toast/useToast'
import { userApi } from '../../services/api'
import { paymentApi } from '../../services/paymentApi'
import type { UserProfileResponse, ApiError } from '../../types/vehicle'
import type { PaymentRecord } from '../../types/payment'
import type { RfidCard } from '../../types/rfid'
import { formatVND } from '../../utils/currency'
import { formatDateTime } from '../../utils/datetime'

type ActiveSection = 'topup' | 'history' | 'member'

const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000]
const MONTHLY_MEMBER_FEE = 1_000_000

const BANK_INFO = {
  bankId: 'TCB',
  accountNo: '19037226140011',
  accountName: 'Phạm Quang Vinh',
  bankName: 'Techcombank',
}


// ── Top-Up Section ──────────────────────────────────────────────────────────

function TopUpSection({
  onDepositSuccess,
}: {
  balance: number
  onDepositSuccess: () => void
}) {
  const toast = useToast()
  const [selectedAmount, setSelectedAmount] = useState<number>(100_000)
  const [customAmount, setCustomAmount] = useState('')
  const [depositing, setDepositing] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const finalAmount = customAmount ? parseInt(customAmount.replace(/\D/g, ''), 10) : selectedAmount
  const isValidAmount = finalAmount >= 10_000 && !isNaN(finalAmount)

  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNo}-compact2.jpg?amount=${finalAmount}&addInfo=NAP%20TIEN%20SMART%20PARKING&accountName=${encodeURIComponent(BANK_INFO.accountName)}`

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const handleDeposit = async () => {
    if (!isValidAmount) {
      toast.error('Minimum deposit is 10,000 ₫')
      return
    }
    setDepositing(true)
    try {
      await paymentApi.deposit(finalAmount)
      toast.success(`Deposited ${formatVND(finalAmount)} successfully`)
      setCustomAmount('')
      setSelectedAmount(100_000)
      onDepositSuccess()
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message || 'Deposit failed')
    } finally {
      setDepositing(false)
    }
  }

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
          Deposit Balance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        {/* Left — amount selector + bank info */}
        <div className="space-y-5">
          {/* Preset amounts */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/40">
              Select Amount
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt)
                    setCustomAmount('')
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                    selectedAmount === amt && !customAmount
                      ? 'border-neon-green bg-neon-green/15 text-neon-green shadow-md shadow-neon-green/10'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {formatVND(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/40">
              Or Enter Custom Amount
            </p>
            <div className="relative">
              <input
                type="text"
                value={customAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setCustomAmount(raw)
                  if (raw) setSelectedAmount(0)
                }}
                placeholder="e.g. 300000"
                className="w-full rounded-xl border border-white/20 bg-white/5 py-3 pl-4 pr-12 text-sm text-white placeholder-white/30 outline-none transition focus:border-neon-green/60 focus:bg-white/10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30">
                VND
              </span>
            </div>
            {customAmount && !isValidAmount && (
              <p className="mt-1 text-xs text-red-400">Minimum amount is 10,000 ₫</p>
            )}
          </div>

          {/* Bank info */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/40">
              Transfer To
            </p>
            <div className="space-y-2">
              {[
                { label: 'Bank', value: BANK_INFO.bankName },
                { label: 'Account No', value: BANK_INFO.accountNo, copyKey: 'acc' },
                { label: 'Account Name', value: BANK_INFO.accountName },
                {
                  label: 'Amount',
                  value: isValidAmount ? formatVND(finalAmount) : '—',
                  highlight: true,
                },
                { label: 'Content', value: 'NAP TIEN SMART PARKING', copyKey: 'content' },
              ].map(({ label, value, copyKey, highlight }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-white/40">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-medium ${highlight ? 'text-neon-green' : 'text-white'}`}
                    >
                      {value}
                    </span>
                    {copyKey && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(value, copyKey)}
                        className="text-white/30 transition hover:text-white/70"
                        title="Copy"
                      >
                        {copied === copyKey ? (
                          <HiOutlineCheck className="h-3.5 w-3.5 text-neon-green" />
                        ) : (
                          <HiOutlineClipboard className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleDeposit}
            disabled={depositing || !isValidAmount}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neon-green py-3 text-sm font-semibold text-black shadow-md transition hover:opacity-90 hover:shadow-neon-green/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {depositing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <HiOutlineCheck className="h-4 w-4" />
            )}
            {depositing ? 'Processing…' : `Confirm Deposit ${isValidAmount ? formatVND(finalAmount) : ''}`}
          </button>
        </div>

        {/* Right — QR code */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-widest text-white/40">
            Scan QR
          </p>
          <div className="overflow-hidden rounded-2xl border-2 border-white/15 bg-white p-3 shadow-lg shadow-black/20">
            {isValidAmount ? (
              <img
                src={qrUrl}
                alt="VietQR payment"
                className="h-52 w-52 object-contain"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="flex h-52 w-52 flex-col items-center justify-center gap-2 text-slate-400">
                <HiOutlineQrcode className="h-12 w-12" />
                <p className="text-center text-xs">Enter a valid amount to generate QR</p>
              </div>
            )}
          </div>
          <p className="max-w-52 text-center text-[11px] leading-relaxed text-white/30">
            Open your banking app → Scan QR → Confirm transfer
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Payment History Section ──────────────────────────────────────────────────

const PAYMENT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; iconCls: string; amountCls: string; sign: '+' | '-' }
> = {
  Deposit: {
    label: 'Deposit',
    icon: HiOutlinePlusSm,
    iconCls: 'bg-emerald-500/15 text-emerald-400',
    amountCls: 'text-emerald-400',
    sign: '+',
  },
  Refund: {
    label: 'Refund',
    icon: HiOutlineReply,
    iconCls: 'bg-sky-500/15 text-sky-400',
    amountCls: 'text-emerald-400',
    sign: '+',
  },
  'Parking Fee': {
    label: 'Parking Fee',
    icon: HiOutlineCash,
    iconCls: 'bg-red-500/15 text-red-400',
    amountCls: 'text-red-400',
    sign: '-',
  },
  Subscription: {
    label: 'Subscription',
    icon: HiOutlineStar,
    iconCls: 'bg-amber-500/15 text-amber-400',
    amountCls: 'text-red-400',
    sign: '-',
  },
}

function PaymentHistorySection() {
  const toast = useToast()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await paymentApi.getMyPayments({
        payment_type: (filterType as PaymentRecord['payment_type']) || undefined,
        status: (filterStatus as PaymentRecord['status']) || undefined,
      })
      setPayments(data)
    } catch (error) {
      const apiError = error as ApiError
      toast.error(apiError.message || 'Failed to load payment history')
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus, toast])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const statusConfig: Record<string, { label: string; cls: string }> = {
    Success: { label: 'Success', cls: 'bg-emerald-500/15 text-emerald-400' },
    Pending: { label: 'Pending', cls: 'bg-amber-500/15 text-amber-400' },
    Failed: { label: 'Failed', cls: 'bg-red-500/15 text-red-400' },
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Payment History
          </p>
          <p className="mt-1 text-xs text-white/30">All your transactions</p>
        </div>
        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-1.5 text-xs text-white/50 transition hover:border-white/30 hover:text-white disabled:opacity-40"
        >
          <HiOutlineRefresh className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70 outline-none transition focus:border-neon-green/50 focus:text-white"
        >
          <option value="">All Types</option>
          <option value="Deposit">Deposit</option>
          <option value="Parking Fee">Parking Fee</option>
          <option value="Subscription">Subscription</option>
          <option value="Refund">Refund</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70 outline-none transition focus:border-neon-green/50 focus:text-white"
        >
          <option value="">All Statuses</option>
          <option value="Success">Success</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-green border-t-transparent" />
        </div>
      ) : payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/30">
          <HiOutlineClipboardList className="h-10 w-10" />
          <p className="text-sm">No payment records found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => {
            const cfg = PAYMENT_TYPE_CONFIG[p.payment_type] ?? {
              label: p.payment_type,
              icon: HiOutlineCreditCard,
              iconCls: 'bg-white/10 text-white/50',
              amountCls: 'text-white',
              sign: '-' as const,
            }
            const Icon = cfg.icon
            const sc = statusConfig[p.status] ?? { label: p.status, cls: 'bg-white/10 text-white/50' }
            return (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/4 px-4 py-3 transition hover:border-white/15"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cfg.iconCls}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {p.description || cfg.label}
                  </p>
                  <p className="text-xs text-white/35">{formatDateTime(p.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-sm font-semibold ${cfg.amountCls}`}>
                    {cfg.sign}{formatVND(p.amount)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.cls}`}>
                    {sc.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Member Plan Section ──────────────────────────────────────────────────────

function MemberPlanSection({ balance }: { balance: number }) {
  const toast = useToast()
  const [rfid, setRfid] = useState<RfidCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    paymentApi
      .getMyRfid()
      .then((data) => setRfid(data))
      .catch(() => setRfid(null))
      .finally(() => setLoading(false))
  }, [])

  const isMember = rfid?.type === 'member'
  const hasEnoughBalance = balance >= MONTHLY_MEMBER_FEE

  const handleRegister = async () => {
    setConfirming(true)
    try {
      const { message } = await paymentApi.subscribe()
      toast.success(message)
      setShowModal(false)
      setRfid((prev) => (prev ? { ...prev, type: 'member' } : prev))
    } catch {
      toast.error('Registration failed. Please check your balance.')
    } finally {
      setConfirming(false)
    }
  }

  const BENEFITS = [
    {
      icon: HiOutlineLightningBolt,
      title: 'Priority Check-In',
      desc: 'Dedicated fast lane for member RFID cards',
    },
    {
      icon: HiOutlineClock,
      title: 'Flat Monthly Rate',
      desc: 'Unlimited parking at a fixed monthly fee',
    },
    {
      icon: HiOutlineShieldCheck,
      title: 'Reserved Slot Access',
      desc: 'Access to member-only reserved parking slots',
    },
    {
      icon: HiOutlineStar,
      title: 'Priority Support',
      desc: 'Dedicated support line for member queries',
    },
  ]

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
          Member Plan
        </p>
        <p className="mt-1 text-xs text-white/30">
          Upgrade your RFID card to enjoy exclusive member benefits.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-green border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Current RFID status */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/40">
              Your RFID Card
            </p>
            {rfid ? (
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neon-green/15 text-neon-green">
                  <HiOutlineCreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{rfid.rfid_code}</p>
                  {rfid.vehicle && (
                    <p className="text-xs text-white/40">
                      {rfid.vehicle.brand} · {rfid.vehicle.license_plate}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isMember
                      ? 'bg-neon-green/20 text-neon-green'
                      : 'bg-white/10 text-white/50'
                  }`}
                >
                  {isMember ? 'Member' : 'Regular'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-white/40">
                <HiOutlineExclamationCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm">No RFID card linked to your account.</p>
              </div>
            )}
          </div>

          {/* Already a member */}
          {isMember && (
            <div className="flex items-start gap-3 rounded-xl border border-neon-green/25 bg-neon-green/8 p-4">
              <HiOutlineShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-neon-green" />
              <div>
                <p className="text-sm font-semibold text-neon-green">You are a Member!</p>
                <p className="mt-0.5 text-xs text-white/50">
                  Your RFID card is enrolled in the member plan.
                  {rfid?.expired_date && (
                    <> Renewal date: {formatDateTime(rfid.expired_date)}</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/40">
              Member Benefits
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-3 rounded-xl border border-white/8 bg-white/4 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neon-green/15 text-neon-green">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-xs text-white/40">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing + CTA */}
          {!isMember && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/40">Monthly Plan</p>
                  <p className="mt-0.5 text-2xl font-bold text-white">
                    {formatVND(MONTHLY_MEMBER_FEE)}
                    <span className="ml-1 text-sm font-normal text-white/40">/ month</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">Your balance</p>
                  <p
                    className={`text-sm font-semibold ${
                      hasEnoughBalance ? 'text-neon-green' : 'text-red-400'
                    }`}
                  >
                    {formatVND(balance)}
                  </p>
                </div>
              </div>

              {!hasEnoughBalance && (
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
                  Insufficient balance. Please top up at least{' '}
                  {formatVND(MONTHLY_MEMBER_FEE - balance)} more.
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowModal(true)}
                disabled={!rfid || !hasEnoughBalance}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-neon-green py-3 text-sm font-semibold text-black shadow-md transition hover:opacity-90 hover:shadow-neon-green/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <HiOutlineStar className="h-4 w-4" />
                Register Member Plan
              </button>

              {!rfid && (
                <p className="mt-2 text-center text-xs text-white/30">
                  You need a linked RFID card to register.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-sidebar-bg p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <h3 className="text-base font-semibold text-white">Confirm Member Registration</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white/40 transition hover:text-white"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 space-y-3 rounded-xl border border-white/8 bg-white/5 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-white/50">Plan</span>
                <span className="font-medium text-white">Monthly Member</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">RFID Card</span>
                <span className="font-medium text-white">{rfid?.rfid_code}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3">
                <span className="text-white/50">Amount charged</span>
                <span className="font-bold text-neon-green">{formatVND(MONTHLY_MEMBER_FEE)}</span>
              </div>
            </div>

            <p className="mb-5 text-xs text-white/35">
              By confirming, {formatVND(MONTHLY_MEMBER_FEE)} will be deducted from your balance.
              Your RFID upgrade request will be reviewed by an admin within 24 hours.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={confirming}
                className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm font-medium text-white/60 transition hover:border-white/30 hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegister}
                disabled={confirming}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neon-green py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {confirming ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                ) : (
                  <HiOutlineCheck className="h-4 w-4" />
                )}
                {confirming ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MyPaymentPage() {
  const toast = useToast()
  const hasFetchedRef = useRef(false)

  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<ActiveSection>('topup')

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const data = await userApi.getUserProfile()
      setProfile(data)
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

  const balance = profile?.balance ?? 0

  const NAV_SECTIONS: { key: ActiveSection; label: string; icon: React.ElementType }[] = [
    { key: 'topup', label: 'Top Up', icon: HiOutlineQrcode },
    { key: 'history', label: 'Payment History', icon: HiOutlineClipboardList },
    { key: 'member', label: 'Member Plan', icon: HiOutlineStar },
  ]

  return (
    <div className="container mx-auto flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-8 pt-1">
      <header className="mb-5 shrink-0">
        <h1 className="text-[20px] font-medium uppercase tracking-[0.2em] text-neon-green">
          My Payment
        </h1>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-neon-green border-t-transparent" />
        </div>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Left — wallet card + nav */}
          <aside className="flex flex-col gap-4">
            {/* Wallet balance card */}
            <div className="rounded-2xl border border-white/10 bg-sidebar-bg/90 p-6 shadow-xl backdrop-blur-md">
              <div className="rounded-xl border border-neon-green/20 bg-neon-green/8 px-4 py-3">
                <p className="mb-0.5 text-xs font-medium uppercase tracking-widest text-white/40">
                  Wallet Balance
                </p>
                <p className="text-xl font-bold text-neon-green">{formatVND(balance)}</p>
              </div>
            </div>

            {/* Section nav */}
            <nav className="overflow-hidden rounded-2xl border border-white/10 bg-sidebar-bg/90 shadow-xl backdrop-blur-md">
              {NAV_SECTIONS.map(({ key, label, icon: Icon }, i) => (
                <div key={key}>
                  {i > 0 && <div className="mx-4 border-t border-white/10" />}
                  <button
                    type="button"
                    onClick={() => setActiveSection(key)}
                    className={`flex w-full items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all ${
                      activeSection === key
                        ? 'bg-neon-green/15 text-neon-green'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                    {activeSection === key && (
                      <HiOutlineChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </nav>
          </aside>

          {/* Right — content */}
          <div className="min-w-0 rounded-2xl border border-white/10 bg-sidebar-bg/90 p-6 shadow-xl backdrop-blur-md">
            {activeSection === 'topup' && (
              <TopUpSection balance={balance} onDepositSuccess={fetchProfile} />
            )}
            {activeSection === 'history' && <PaymentHistorySection />}
            {activeSection === 'member' && <MemberPlanSection balance={balance} />}
          </div>
        </div>
      )}
    </div>
  )
}
