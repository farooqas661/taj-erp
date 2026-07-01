import { useEffect, useRef } from "react";

import { Html5Qrcode } from "html5-qrcode";

const SCANNER_ID = "wallet-qr-scanner";

export default function QrScanner({
  onScan,
  onClose,
}) {
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);

  onScanRef.current = onScan;

  useEffect(() => {
    let active = true;
    const html5QrCode = new Html5Qrcode(SCANNER_ID);

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (!active) return;

            onScanRef.current(decodedText);
            void html5QrCode
              .stop()
              .then(() => html5QrCode.clear())
              .finally(() => onClose());
          },
          () => {}
        );

        scannerRef.current = html5QrCode;
      } catch {
        alert(
          "Camera not available. Allow camera permission or enter shop code manually."
        );
        onClose();
      }
    };

    void startScanner();

    return () => {
      active = false;

      if (scannerRef.current) {
        void scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-[35px] border border-white/10 bg-[#0b0b0d] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black">
            Scan Shopkeeper QR
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-red-500 font-black text-xl"
          >
            ✕
          </button>
        </div>

        <p className="text-white/50 text-sm mb-4">
          Point camera at shopkeeper QR code
        </p>

        <div
          id={SCANNER_ID}
          className="w-full overflow-hidden rounded-2xl bg-black"
        />
      </div>
    </div>
  );
}
