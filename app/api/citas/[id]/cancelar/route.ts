import { NextRequest, NextResponse } from 'next/server';
import { getCitas, updateCita } from '@/lib/actions/database';

/**
 * GET /api/citas/[id]/cancelar?token=xxx
 * Cancela una cita usando el token del email
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/cita-error?reason=no-token', request.url));
    }

    // Obtener la cita
    const citas = await getCitas();
    const cita = citas.find((c: any) => c.id === id);

    if (!cita) {
      return NextResponse.redirect(new URL('/cita-error?reason=not-found', request.url));
    }

    // Validar token
    if (cita.confirmation_token !== token) {
      return NextResponse.redirect(new URL('/cita-error?reason=invalid-token', request.url));
    }

    // Solo se puede cancelar si no está completada
    if (cita.estado === 'completada') {
      return NextResponse.redirect(new URL('/cita-error?reason=already-completed', request.url));
    }

    if (cita.estado === 'cancelada') {
      return NextResponse.redirect(new URL('/cita-error?reason=already-cancelled', request.url));
    }

    // Actualizar estado
    await updateCita(id, { estado: 'cancelada' });

    // Redirigir a página de cancelación exitosa
    return NextResponse.redirect(new URL(`/cita-cancelada?cita=${id}`, request.url));
  } catch (error: any) {
    console.error('Error cancelando cita:', error);
    return NextResponse.redirect(new URL('/cita-error?reason=server-error', request.url));
  }
}

