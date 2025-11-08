import { NextRequest, NextResponse } from "next/server";
import { verificarQRCheckIn } from "@/lib/actions/qr-checkin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode } = body;

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: "Código QR requerido" },
        { status: 400 }
      );
    }

    // Obtener información del cliente
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const result = await verificarQRCheckIn({
      qrCode,
      ipAddress,
      userAgent,
    });

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Error en API check-in QR:", error);
    return NextResponse.json(
      { success: false, message: "Error al procesar el check-in" },
      { status: 500 }
    );
  }
}
