import type { PaginatedResponse, PaginationMeta } from '../types/pagination'

function normalizeMeta(raw: unknown): PaginationMeta | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as Record<string, unknown>
  const total = m.total
  const page = m.page
  const limit = m.limit
  const total_pages = m.total_pages ?? m.totalPages
  if (
    total == null &&
    page == null &&
    limit == null &&
    total_pages == null
  ) {
    return null
  }
  return {
    total: Number(total ?? 0),
    page: Number(page ?? 1),
    limit: Number(limit ?? 0),
    total_pages: Number(total_pages ?? 0),
  }
}

function normalizeListData<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (!raw || typeof raw !== 'object') return []
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.data)) return obj.data as T[]
  if (Array.isArray(obj.items)) return obj.items as T[]
  if (Array.isArray(obj.results)) return obj.results as T[]
  return []
}

/** Normalizes backend list payloads into `{ data, pagination }`. */
export function normalizePaginatedResponse<T>(raw: unknown): PaginatedResponse<T> {
  if (Array.isArray(raw)) {
    return {
      data: raw as T[],
      pagination: {
        total: raw.length,
        page: 1,
        limit: raw.length,
        total_pages: 1,
      },
    }
  }

  if (!raw || typeof raw !== 'object') {
    return {
      data: [],
      pagination: { total: 0, page: 1, limit: 0, total_pages: 0 },
    }
  }

  const obj = raw as Record<string, unknown>
  const data = normalizeListData<T>(raw)
  const pagination =
    normalizeMeta(obj.pagination) ??
    normalizeMeta(obj.meta) ??
    normalizeMeta(obj.page_info) ??
    { total: data.length, page: 1, limit: data.length, total_pages: 1 }

  return { data, pagination }
}
