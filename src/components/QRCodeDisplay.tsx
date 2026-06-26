import { QRCodeSVG } from "qrcode.react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrToken: string;
  vehiclePlate?: string;
  onGenerate: () => void;
  generating: boolean;
}

function QRCodeModal({
  isOpen,
  onClose,
  qrToken,
  vehiclePlate,
  onGenerate,
  generating,
}: QRCodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl bg-sidebar-bg p-6 shadow-xl">
        {qrToken ? (
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center">
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white ml-auto"
              >
                ✕
              </button>
              <h2 className="mb-1 text-2xl font-bold text-white">QR Code</h2>
              {vehiclePlate && (
                <p className="mb-3 text-lg text-neon-green">
                  Vehicle: {vehiclePlate}
                </p>
              )}
              <div className="rounded-xl border-2 border-white/20 bg-white p-4 shadow-lg">
                <QRCodeSVG value={qrToken} size={280} level="H" />
              </div>
              <p className="mt-3 max-w-xs text-center text-sm text-white/50">
                Scan this QR code to check in
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="w-full rounded-xl bg-neon-green px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate QR Code"}
          </button>
        )}
      </div>
    </div>
  );
}

export default QRCodeModal;
