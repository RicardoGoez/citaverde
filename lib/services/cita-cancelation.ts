/**
 * Servicio para manejar cancelación de citas con validaciones y notificaciones
 */

import { getCitas, updateCita, getProfesionalById } from '@/lib/actions/database';
import { puedeCancelarCita } from '@/lib/utils/cita-validations';
import { NotificationService } from './notifications';
import { getUserById } from '@/lib/auth';

/**
 * Cancela una cita con validaciones y notificaciones
 */
export async function cancelarCitaConValidaciones(
  citaId: string,
  options?: { skipTimeValidation?: boolean; skipNotifications?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener la cita
    const citas = await getCitas();
    const cita = citas.find((c: any) => c.id === citaId);

    if (!cita) {
      return { success: false, error: 'Cita no encontrada' };
    }

    // Validar estado
    if (cita.estado === 'cancelada') {
      return { success: false, error: 'Esta cita ya fue cancelada' };
    }

    if (cita.estado === 'completada') {
      return { success: false, error: 'No se puede cancelar una cita completada' };
    }

    // Validar tiempo mínimo (si no se omite)
    if (!options?.skipTimeValidation) {
      const validacionTiempo = puedeCancelarCita(cita.fecha, cita.hora);
      if (!validacionTiempo.puede) {
        return { success: false, error: validacionTiempo.razon || 'No se puede cancelar esta cita' };
      }
    }

    // Cancelar la cita
    await updateCita(citaId, { estado: 'cancelada' });

    // Enviar notificaciones (si no se omiten)
    if (!options?.skipNotifications) {
      try {
        // Notificar al profesional si tiene email
        if (cita.profesional_id) {
          const profesional = await getProfesionalById(cita.profesional_id);
          if (profesional?.email) {
            await NotificationService.notifyProfesionalCitaCancelada(
              cita.profesional_id,
              {
                servicio: cita.servicio,
                fecha: cita.fecha,
                hora: cita.hora,
                paciente_name: cita.paciente_name,
                user_name: cita.user_name,
              },
              profesional.email
            );
          }
        }

        // Notificar a usuarios en lista de espera (si existe la funcionalidad)
        // Por ahora, esto es un placeholder - se puede implementar cuando se agregue lista de espera
        // await NotificationService.notifyListaEsperaSlotDisponible(...);
      } catch (notifError) {
        console.error('Error enviando notificaciones de cancelación:', notifError);
        // No fallar la cancelación si las notificaciones fallan
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error cancelando cita:', error);
    return { success: false, error: error.message || 'Error al cancelar la cita' };
  }
}

