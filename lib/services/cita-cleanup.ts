/**
 * Servicio para limpiar y procesar citas pasadas
 */

import { getCitas, updateCita } from '@/lib/actions/database';

/**
 * Procesa citas pasadas y las marca como "no_show" si no tienen check-in
 * Debe ejecutarse periódicamente (ej: cada hora o diariamente)
 */
export async function procesarCitasPasadas(): Promise<{
  procesadas: number;
  marcadasNoShow: number;
  errores: number;
}> {
  let procesadas = 0;
  let marcadasNoShow = 0;
  let errores = 0;

  try {
    console.log('🔄 Procesando citas pasadas...');

    // Obtener todas las citas confirmadas
    const citas = await getCitas({ estado: 'confirmada' });
    const ahora = new Date();

    for (const cita of citas) {
      try {
        // Crear fecha/hora de la cita
        const [año, mes, dia] = cita.fecha.split('-').map(Number);
        const [horas, minutos] = cita.hora.split(':').map(Number);
        const fechaCita = new Date(año, mes - 1, dia, horas, minutos, 0, 0);

        // Verificar si la cita ya pasó (más de 1 hora después de la hora de la cita)
        const diffMs = ahora.getTime() - fechaCita.getTime();
        const diffHoras = diffMs / (1000 * 60 * 60);

        // Si la cita pasó hace más de 1 hora y no tiene check-in, marcar como no_show
        if (diffHoras > 1) {
          // Verificar si tiene check-in (asumiendo que hay un campo check_in_at o similar)
          const tieneCheckIn = cita.check_in_at || cita.check_in || false;

          if (!tieneCheckIn) {
            // Marcar como no_show
            await updateCita(cita.id, { 
              estado: 'no_show',
              no_show: true,
              updated_at: new Date().toISOString()
            });
            marcadasNoShow++;
            console.log(`✅ Cita ${cita.id} marcada como no_show`);
          } else {
            // Si tiene check-in pero sigue en estado confirmada, marcar como completada
            await updateCita(cita.id, { 
              estado: 'completada',
              updated_at: new Date().toISOString()
            });
            console.log(`✅ Cita ${cita.id} marcada como completada (tenía check-in)`);
          }
          procesadas++;
        }
      } catch (error) {
        console.error(`❌ Error procesando cita ${cita.id}:`, error);
        errores++;
      }
    }

    console.log(`✅ Proceso completado: ${procesadas} procesadas, ${marcadasNoShow} marcadas como no_show, ${errores} errores`);
    
    return { procesadas, marcadasNoShow, errores };
  } catch (error) {
    console.error('❌ Error en proceso de limpieza de citas:', error);
    return { procesadas, marcadasNoShow, errores };
  }
}

