import { NextRequest, NextResponse } from "next/server";
import { processScheduledReminders } from "@/lib/services/reminders";

/**
 * API route para ejecutar recordatorios programados
 * En producción, esto se llamaría desde un cron job o servicio de tareas
 * 
 * Ejemplo de configuración en Vercel Cron:
 * vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/reminders",
 *     "schedule": "0 * * * *"  // Cada hora
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorización (simple)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      );
    }

    // Ejecutar recordatorios
    await processScheduledReminders();

    return NextResponse.json(
      { success: true, message: "Recordatorios procesados" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en API de recordatorios:", error);
    return NextResponse.json(
      { success: false, message: "Error procesando recordatorios" },
      { status: 500 }
    );
  }
}

/**
 * POST para testing manual
 */
export async function POST(request: NextRequest) {
  try {
    await processScheduledReminders();
    return NextResponse.json(
      { success: true, message: "Recordatorios procesados manualmente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en API de recordatorios:", error);
    return NextResponse.json(
      { success: false, message: "Error procesando recordatorios" },
      { status: 500 }
    );
  }
}

