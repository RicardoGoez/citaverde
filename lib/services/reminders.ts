import { getCitas } from "@/lib/actions/database";
import { NotificationService } from "./notifications";
import { getUserById } from "@/lib/auth";

/**
 * Servicio de recordatorios programados
 * En producción, esto se ejecutaría con un cron job o servicio de tareas
 */

export interface ReminderJob {
  id: string;
  citaId: string;
  userId: string;
  reminderTime: Date;
  sent: boolean;
}

/**
 * Procesa recordatorios pendientes
 * Debe ejecutarse periódicamente (ej: cada hora)
 */
export async function processScheduledReminders() {
  try {
    console.log("🔔 Procesando recordatorios programados...");

    // Obtener citas confirmadas para hoy y mañana
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const citas = await getCitas({ estado: 'confirmada' });
    
    // Filtrar citas que necesitan recordatorio
    const citasParaRecordar = citas.filter((cita: any) => {
      const fechaCita = new Date(cita.fecha);
      const ahora = new Date();
      
      // Enviar recordatorio si la cita es dentro de 24 horas pero no en el pasado
      const diffHours = (fechaCita.getTime() - ahora.getTime()) / (1000 * 60 * 60);
      
      return diffHours <= 24 && diffHours >= 0;
    });

    console.log(`📋 ${citasParaRecordar.length} citas encontradas para recordar`);

    // Enviar recordatorios
    for (const cita of citasParaRecordar) {
      try {
        // Obtener datos del usuario
        const user = await getUserById(cita.user_id);
        
        if (!user) {
          console.warn(`⚠️ Usuario no encontrado para cita ${cita.id}`);
          continue;
        }

        // Enviar recordatorio
        await NotificationService.notifyRecordatorio(
          cita.user_id,
          {
            servicio: cita.servicio,
            fecha: cita.fecha,
            hora: cita.hora,
            profesional: cita.profesional || '',
          },
          user.email
        );

        console.log(`✅ Recordatorio enviado para cita ${cita.id}`);
        
        // Pequeño delay para no saturar el sistema de email
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error enviando recordatorio para cita ${cita.id}:`, error);
      }
    }

    console.log("✅ Proceso de recordatorios completado");
  } catch (error) {
    console.error("❌ Error en proceso de recordatorios:", error);
  }
}

/**
 * API route para ejecutar recordatorios manualmente
 * En producción, esto se llamaría desde un cron job
 */
export async function GET() {
  await processScheduledReminders();
  return new Response("Recordatorios procesados", { status: 200 });
}

