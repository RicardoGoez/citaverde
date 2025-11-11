import { NextRequest, NextResponse } from 'next/server';
import { procesarCitasPasadas } from '@/lib/services/cita-cleanup';

/**
 * API endpoint para procesar citas pasadas
 * Puede ser llamado por un cron job (ej: Vercel Cron, GitHub Actions, etc.)
 * 
 * Para configurar en Vercel, agregar a vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-past-appointments",
 *     "schedule": "0 * * * *"  // Cada hora
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autorización (opcional: agregar token de seguridad)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Procesar citas pasadas
    const resultado = await procesarCitasPasadas();

    return NextResponse.json({
      success: true,
      message: 'Citas pasadas procesadas',
      resultado,
    });
  } catch (error: any) {
    console.error('Error en cron de procesamiento de citas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error procesando citas' },
      { status: 500 }
    );
  }
}

// También permitir POST para compatibilidad
export async function POST(request: NextRequest) {
  return GET(request);
}

