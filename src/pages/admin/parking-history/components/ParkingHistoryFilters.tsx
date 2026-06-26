import { AdminFilterPills } from '../../../../components/admin/AdminFilterPills'
import { AdminFilterToolbar } from '../../../../components/admin/AdminFilterToolbar'
import {
  AdminFilterField,
  adminFilterFieldCls,
} from '../../../../components/admin/AdminFilterField'
import type { ParkingArea } from '../../../../types/parking'

export type PaymentMethodFilter = 'all' | 'Wallet' | 'Membership'

export interface ParkingHistoryFiltersValues {
  fromDate: string
  toDate: string
  parkingAreaId: string
  paymentMethod: PaymentMethodFilter
  keyword: string
}

export interface ParkingHistoryFiltersProps {
  values: ParkingHistoryFiltersValues
  onChange: (next: ParkingHistoryFiltersValues) => void
  areaOptions?: ParkingArea[]
}

const PAYMENT_METHOD_TABS: { key: PaymentMethodFilter; label: string }[] = [
  { key: 'all', label: 'All Methods' },
  { key: 'Wallet', label: 'Wallet' },
  { key: 'Membership', label: 'Membership' },
]

export function ParkingHistoryFilters({
  values,
  onChange,
  areaOptions = [],
}: ParkingHistoryFiltersProps) {
  const setValue = (patch: Partial<ParkingHistoryFiltersValues>) => {
    onChange({ ...values, ...patch })
  }

  return (
    <>
      <AdminFilterPills
        tabs={PAYMENT_METHOD_TABS}
        value={values.paymentMethod}
        onChange={(key: PaymentMethodFilter) => setValue({ paymentMethod: key })}
      />

      <AdminFilterToolbar
        search={{
          value: values.keyword,
          onChange: (v: string) => setValue({ keyword: v }),
          placeholder: 'Search plate, user name or phone…',
        }}
      >
        <AdminFilterField label="From">
          <input
            type="date"
            value={values.fromDate}
            onChange={(e) => setValue({ fromDate: e.target.value })}
            className={adminFilterFieldCls}
          />
        </AdminFilterField>
        <AdminFilterField label="To">
          <input
            type="date"
            value={values.toDate}
            onChange={(e) => setValue({ toDate: e.target.value })}
            className={adminFilterFieldCls}
          />
        </AdminFilterField>
        <AdminFilterField label="Parking area">
          <select
            value={values.parkingAreaId}
            onChange={(e) => setValue({ parkingAreaId: e.target.value })}
            className={`min-w-[140px] ${adminFilterFieldCls}`}
          >
            <option value="" className="bg-sidebar-bg">
              All areas
            </option>
            {areaOptions.map((a) => (
              <option key={a.id} value={a.id} className="bg-sidebar-bg">
                Area {a.name}
              </option>
            ))}
          </select>
        </AdminFilterField>
      </AdminFilterToolbar>
    </>
  )
}
