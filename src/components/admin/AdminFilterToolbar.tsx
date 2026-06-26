import type { ReactNode } from 'react'
import { AdminSearchInput } from './AdminSearchInput'

export interface AdminFilterToolbarSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export interface AdminFilterToolbarProps {
  search?: AdminFilterToolbarSearchProps
  children?: ReactNode
}

/** Flat toolbar row — filters left, search pushed right (Payment Management layout). */
export function AdminFilterToolbar({ search, children }: AdminFilterToolbarProps) {
  return (
    <div className="flex w-full flex-wrap items-end gap-3">
      {children}
      {search ? (
        <AdminSearchInput
          value={search.value}
          onChange={search.onChange}
          placeholder={search.placeholder}
          inputClassName="ml-auto w-full min-w-0 sm:w-60"
        />
      ) : null}
    </div>
  )
}
