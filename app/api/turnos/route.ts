import { NextRequest, NextResponse } from 'next/server';
import { mockTurnos, mockServicios } from '@/lib/data';

/**
 * GET /api/turnos - Obtener todos los turnos
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const estado = searchParams.get('estado');

    let turnos = [...mockTurnos];

    // Filtrar por userId
    if (userId) {
      turnos = turnos.filter(t => t.userId === userId);
    }

    // Filtrar por estado
    if (estado) {
      turnos = turnos.filter(t => t.estado === estado);
    }

    return NextResponse.json({
      success: true,
      data: turnos,
      count: turnos.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al obtener turnos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/turnos - Crear nuevo turno
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos requeridos
    if (!body.userId || !body.servicioId) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Generar número de turno
    const numero = mockTurnos.length + 1;
    const newId = `TUR-${String(mockTurnos.length + 1).padStart(3, '0')}`;

    const servicio = mockServicios.find(s => s.id === body.servicioId);

    const nuevoTurno = {
      id: newId,
      userId: body.userId,
      paciente: body.paciente,
      sedeId: body.sedeId,
      servicioId: body.servicioId,
      servicio: servicio?.name || 'Servicio',
      numero: numero,
      cola: body.cola || 'Principal',
      estado: 'en_espera',
      tiempoEstimado: servicio?.duration || 30,
      creadoAt: new Date().toISOString(),
      createdAt: new Date(),
    };

    // En producción, aquí se guardaría en la BD
    mockTurnos.push(nuevoTurno);

    return NextResponse.json({
      success: true,
      data: nuevoTurno,
      message: 'Turno creado exitosamente',
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al crear turno' },
      { status: 500 }
    );
  }
}
