"use client";

import { useEffect, useState } from "react";
import { generateQRCode } from "@/lib/utils/qr";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode } from "lucide-react";

interface QRDisplayProps {
  data: string;
  size?: number;
  className?: string;
}

export function QRDisplay({ data, size = 200, className = "" }: QRDisplayProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadQR = async () => {
      try {
        const url = await generateQRCode(data);
        setQrUrl(url);
      } catch (err) {
        console.error("Error generando QR:", err);
        setError(true);
      }
    };

    loadQR();
  }, [data]);

  if (error) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <QrCode className="h-12 w-12 text-gray-400" />
      </div>
    );
  }

  if (!qrUrl) {
    return (
      <Skeleton
        className={className}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={qrUrl}
      alt="Código QR"
      className={`rounded-lg ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
