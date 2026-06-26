import { HiOutlineCreditCard } from "react-icons/hi";
import ColorDot from "./ColorDot";
import type { Vehicle } from "../types/vehicle";
import { getVehicleBrand } from "../constants/vehicles";

interface Props {
  vehicle: Vehicle;
  selected?: boolean;
  onClick?: () => void;
  /** Row: compact list row for master–detail layouts. Card: default grid tile. */
  layout?: "card" | "row";
}

export default function VehicleCard({
  vehicle,
  selected,
  onClick,
  layout = "card",
}: Props) {
  const brand = getVehicleBrand(vehicle.brand);
  const hasRfid = !!(vehicle.rfid?.rfid_code && String(vehicle.rfid.rfid_code).trim());

  if (layout === "row") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full min-w-0 items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition ${
          selected
            ? "border-neon-green bg-neon-green-dim shadow-[0_0_0_1px_rgba(0,255,136,0.15)]"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
        }`}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
          {brand ? (
            <img
              src={brand.logo}
              alt=""
              className="h-8 w-8 object-contain"
            />
          ) : (
            <span className="text-xs font-bold text-black/40">—</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-wide text-white">
            {vehicle.license_plate}
          </p>
          <p className="truncate text-xs text-white/50">
            {brand?.label ?? vehicle.brand}
            <span className="mx-1.5 text-white/25">·</span>
            <span className="inline-flex items-center gap-1 align-middle">
              <ColorDot color={vehicle.color} size={10} />
            </span>
          </p>
        </div>
        <span
          className="shrink-0"
          title={hasRfid ? "RFID linked" : "No RFID"}
        >
          <HiOutlineCreditCard
            className={`h-5 w-5 ${
              hasRfid ? "text-neon-green" : "text-white/25"
            }`}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-full w-full rounded-xl border-2 p-4 text-center transition ${
        selected
          ? "border-neon-green bg-neon-green-dim"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      }`}
    >
      <p className="mb-3 text-xl font-bold tracking-wider text-white">
        {vehicle.license_plate}
      </p>

      <div className="mx-auto mb-3 flex h-30 w-30 items-center justify-center rounded-lg bg-white">
        {brand && (
          <img
            src={brand.logo}
            alt={brand.label}
            className="h-20 w-20 object-contain"
          />
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xl text-white/70">
        <span>{brand?.label}</span>
        <ColorDot color={vehicle.color} />
      </div>
    </button>
  );
}
