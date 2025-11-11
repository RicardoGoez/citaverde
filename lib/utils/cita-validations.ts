/**
 * Utilidades para validaciones de citas
 */

/**
 * Configuración de límites (puede moverse a base de datos o variables de entorno)
 */
export const CITA_CONFIG = {
  MIN_HORAS_PARA_CANCELAR: 2, // Mínimo de horas antes de la cita para poder cancelar
  MIN_HORAS_PARA_REPROGRAMAR: 2, // Mínimo de horas antes de la cita para poder reprogramar
  MAX_CITAS_ACTIVAS_POR_USUARIO: 3, // Máximo de citas activas simultáneas por usuario
};

/**
 * Calcula las horas restantes hasta una cita
 */
export function calcularHorasRestantes(fecha: string, hora: string): number {
  // Crear fecha de la cita en hora local
  const [año, mes, dia] = fecha.split('-').map(Number);
  const [horas, minutos] = hora.split(':').map(Number);
  
  const fechaCita = new Date(año, mes - 1, dia, horas, minutos, 0, 0);
  const ahora = new Date();
  
  const diffMs = fechaCita.getTime() - ahora.getTime();
  const diffHoras = diffMs / (1000 * 60 * 60);
  
  return diffHoras;
}

/**
 * Valida si se puede cancelar una cita (debe tener al menos X horas antes)
 */
export function puedeCancelarCita(fecha: string, hora: string): { puede: boolean; razon?: string } {
  const horasRestantes = calcularHorasRestantes(fecha, hora);
  
  if (horasRestantes < 0) {
    return { puede: false, razon: 'Esta cita ya pasó' };
  }
  
  if (horasRestantes < CITA_CONFIG.MIN_HORAS_PARA_CANCELAR) {
    return { 
      puede: false, 
      razon: `No se puede cancelar una cita con menos de ${CITA_CONFIG.MIN_HORAS_PARA_CANCELAR} horas de anticipación. Faltan ${Math.round(horasRestantes * 10) / 10} horas.` 
    };
  }
  
  return { puede: true };
}

/**
 * Valida si se puede reprogramar una cita (debe tener al menos X horas antes)
 */
export function puedeReprogramarCita(fecha: string, hora: string): { puede: boolean; razon?: string } {
  const horasRestantes = calcularHorasRestantes(fecha, hora);
  
  if (horasRestantes < 0) {
    return { puede: false, razon: 'Esta cita ya pasó' };
  }
  
  if (horasRestantes < CITA_CONFIG.MIN_HORAS_PARA_REPROGRAMAR) {
    return { 
      puede: false, 
      razon: `No se puede reprogramar una cita con menos de ${CITA_CONFIG.MIN_HORAS_PARA_REPROGRAMAR} horas de anticipación. Faltan ${Math.round(horasRestantes * 10) / 10} horas.` 
    };
  }
  
  return { puede: true };
}

/**
 * Valida si un usuario puede crear más citas (límite de citas activas)
 */
export function validarLimiteCitasActivas(
  citasActivas: number,
  maxCitas: number = CITA_CONFIG.MAX_CITAS_ACTIVAS_POR_USUARIO
): { puede: boolean; razon?: string } {
  if (citasActivas >= maxCitas) {
    return { 
      puede: false, 
      razon: `Ya tienes ${citasActivas} citas activas. El límite es de ${maxCitas} citas simultáneas. Por favor, cancela o completa alguna cita antes de crear una nueva.` 
    };
  }
  
  return { puede: true };
}

