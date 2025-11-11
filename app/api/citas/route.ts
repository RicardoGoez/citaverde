import { NextRequest, NextResponse } from 'next/server';
import { getCitas, createCita } from '@/lib/actions/database';

/**
 * GET /api/citas - Obtener todas las citas
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const estado = searchParams.get('estado');

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (estado) filters.estado = estado;

    const citas = await getCitas(filters);

    return NextResponse.json({
      success: true,
      data: citas,
      count: citas.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al obtener citas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/citas - Crear nueva cita
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos requeridos
    if (!body.user_id || !body.servicio_id || !body.fecha || !body.hora) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Crear la cita usando la función de database
    const nuevaCita = await createCita({
      user_id: body.user_id,
      sede_id: body.sede_id,
      servicio_id: body.servicio_id,
      servicio: body.servicio,
      profesional_id: body.profesional_id,
      profesional: body.profesional,
      fecha: body.fecha,
      hora: body.hora,
      motivo: body.motivo
    });

    return NextResponse.json({
      success: true,
      data: nuevaCita,
      message: 'Cita creada exitosamente',
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al crear cita' },
      { status: 500 }
    );
  }
}
