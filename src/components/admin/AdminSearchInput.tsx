import { HiOutlineSearch } from 'react-icons/hi'

export interface AdminSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inputClassName?: string
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  inputClassName = '',
}: AdminSearchInputProps) {
  return (
    <div className={`relative ${inputClassName}`.trim()}>
      <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/20 bg-[#12151c] py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/35 focus:border-neon-green focus:outline-none focus:ring-2 focus:ring-neon-green/25"
      />
    </div>
  )
}
