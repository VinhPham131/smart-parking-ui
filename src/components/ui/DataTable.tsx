import { Fragment, type ReactNode } from 'react'

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  headerClassName?: string
  cellClassName?: string
  render: (row: T) => ReactNode
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string
  loading?: boolean
  emptyMessage?: string
  skeletonRows?: number
  /** Renders an extra row below the data row when provided and expanded */
  renderSubRow?: (row: T) => ReactNode
  isSubRowVisible?: (row: T) => boolean
  getRowClassName?: (row: T) => string | undefined
  /** Called with the <tr> element for the given row key (used for scroll-to) */
  getRowRef?: (key: string) => ((el: HTMLTableRowElement | null) => void) | undefined
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyMessage = 'No data found.',
  skeletonRows = 5,
  renderSubRow,
  isSubRowVisible,
  getRowClassName,
  getRowRef,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-sidebar-bg/90 shadow-xl backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70 ${col.headerClassName ?? ''}`.trim()}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading &&
              data.length === 0 &&
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`sk-${i}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 rounded-lg bg-white/10" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              data.map((row) => {
                const id = rowKey(row)
                const showSub =
                  renderSubRow && isSubRowVisible?.(row)

                return (
                  <Fragment key={id}>
                    <tr
                      ref={getRowRef?.(id)}
                      className={`transition-colors hover:bg-white/5 ${getRowClassName?.(row) ?? ''}`.trim()}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 text-center text-sm text-white/80 ${col.cellClassName ?? ''}`.trim()}
                        >
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                    {showSub ? (
                      <tr className="bg-black/20">
                        <td colSpan={columns.length} className="px-4 py-3">
                          {renderSubRow(row)}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}

            {!loading && data.length === 0 && (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-4 py-12 text-center text-sm text-white/50"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
