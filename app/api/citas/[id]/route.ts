import { NextRequest, NextResponse } from 'next/server';
import { updateCita } from '@/lib/actions/database';

/**
 * GET /api/citas/[id] - Obtener cita por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Usar Supabase para obtener la cita
    const { supabase } = await import('@/lib/supabase');
    const { data: cita, error } = await supabase
      .from('citas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !cita) {
      return NextResponse.json(
        { success: false, error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cita,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al obtener cita' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/citas/[id] - Actualizar campos específicos de una cita
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Actualizar la cita en Supabase
    const citaActualizada = await updateCita(id, body);

    return NextResponse.json({
      success: true,
      data: citaActualizada,
      message: 'Cita actualizada exitosamente',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar cita' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/citas/[id] - Actualizar cita
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Actualizar la cita en Supabase
    const citaActualizada = await updateCita(id, body);

    return NextResponse.json({
      success: true,
      data: citaActualizada,
      message: 'Cita actualizada exitosamente',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar cita' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/citas/[id] - Cancelar/Eliminar cita
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verificar existencia en Supabase
    const { supabase } = await import('@/lib/supabase');
    const { data: cita, error } = await supabase
      .from('citas')
      .select('id, estado')
      .eq('id', id)
      .single();

    if (error || !cita) {
      return NextResponse.json(
        { success: false, error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Marcar como cancelada
    await updateCita(id, { estado: 'cancelada' });

    return NextResponse.json({ success: true, message: 'Cita cancelada exitosamente' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al cancelar cita' },
      { status: 500 }
    );
  }
}
