import { supabase } from '@/lib/supabase';

/**
 * Obtener todas las citas
 */
export async function getCitas(filters?: { userId?: string; estado?: string }) {
  try {
    console.log('🔍 Iniciando consulta de citas con filtros:', filters);
    
    let query = supabase.from('citas').select('*');

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    console.log('📊 Datos de citas obtenidos:', data?.length || 0, 'registros');
    
    if (error) {
      console.error('❌ Error obteniendo citas:', error);
      console.error('Mensaje del error:', error.message);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      return [];
    }

    if (data && data.length > 0) {
      console.log('✅ Primeras 3 citas:', data.slice(0, 3).map(c => ({
        id: c.id,
        paciente: c.paciente_name || c.user_id,
        fecha: c.fecha,
        estado: c.estado
      })));
    } else {
      console.log('⚠️ No hay citas en la base de datos');
    }

    return data || [];
  } catch (err) {
    console.error('❌ Error inesperado obteniendo citas:', err);
    console.error('Error completo:', JSON.stringify(err, null, 2));
    return [];
  }
}

/**
 * Crear una nueva cita
 */
export async function createCita(cita: {
  user_id: string;
  sede_id: string;
  servicio_id: string;
  servicio: string;
  profesional_id: string;
  profesional: string;
  fecha: string;
  hora: string;
  motivo?: string;
}) {
  // Generar ID único
  const newId = `CT-${String(Date.now()).slice(-6)}`;

  // Generar token único para confirmación/cancelación por email
  const confirmationToken = crypto.randomUUID();

  const { data, error } = await supabase
    .from('citas')
    .insert({
      id: newId,
      ...cita,
      estado: 'confirmada',
      confirmation_token: confirmationToken,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando cita:', error);
    throw error;
  }

  return { ...data, confirmationToken };
}

/**
 * Actualizar una cita
 */
export async function updateCita(id: string, updates: Partial<any>) {
  const { data, error } = await supabase
    .from('citas')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando cita:', error);
    throw error;
  }

  return data;
}

/**
 * Eliminar una cita
 */
export async function deleteCita(id: string) {
  const { error } = await supabase
    .from('citas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando cita:', error);
    throw error;
  }

  return true;
}

/**
 * Obtener todos los turnos
 */
export async function getTurnos(filters?: { userId?: string; estado?: string }) {
  try {
    console.log('🔍 Iniciando consulta de turnos con filtros:', filters);
    
    let query = supabase.from('turnos').select('*');

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    console.log('🎫 Datos de turnos obtenidos:', data?.length || 0, 'registros');
    
    if (error) {
      console.error('❌ Error obteniendo turnos:', error);
      console.error('Mensaje del error:', error.message);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      return [];
    }

    if (data && data.length > 0) {
      console.log('✅ Primeros 3 turnos:', data.slice(0, 3).map(t => ({
        id: t.id,
        numero: t.numero,
        paciente: t.user_name || t.paciente,
        estado: t.estado
      })));
    } else {
      console.log('⚠️ No hay turnos en la base de datos');
    }

    return data || [];
  } catch (err) {
    console.error('❌ Error inesperado obteniendo turnos:', err);
    console.error('Error completo:', JSON.stringify(err, null, 2));
    return [];
  }
}

/**
 * Crear un nuevo turno
 */
export async function createTurno(turno: {
  user_id: string;
  paciente: string;
  sede_id: string;
  servicio_id: string;
  servicio: string;
  numero: number;
  cola: string;
  tiempo_estimado: number;
}) {
  const newId = `TUR-${String(Date.now()).slice(-6)}`;

  const { data, error } = await supabase
    .from('turnos')
    .insert({
      id: newId,
      ...turno,
      estado: 'en_espera',
      creado_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando turno:', error);
    throw error;
  }

  return data;
}

/**
 * Actualizar un turno
 */
export async function updateTurno(id: string, updates: Partial<any>) {
  const { data, error } = await supabase
    .from('turnos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando turno:', error);
    throw error;
  }

  return data;
}

/**
 * Obtener sedes
 */
export async function getSedes() {
  const { data, error } = await supabase
    .from('sedes')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error obteniendo sedes:', error);
    return [];
  }

  return data || [];
}

/**
 * Crear una sede
 */
export async function createSede(sede: {
  id: string;
  name: string;
  address: string;
  phone: string;
  is_active?: boolean;
}) {
  const { data, error } = await supabase
    .from('sedes')
    .insert({
      ...sede,
      is_active: sede.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando sede:', error);
    throw error;
  }

  return data;
}

/**
 * Obtener servicios
 */
export async function getServicios(sedeId?: string) {
  try {
    let query = supabase.from('servicios').select('*');

    if (sedeId) {
      query = query.eq('sede_id', sedeId);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error obteniendo servicios:', error);
      console.error('Mensaje del error:', error.message);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error inesperado obteniendo servicios:', err);
    return [];
  }
}

/**
 * Crear un servicio
 */
export async function createServicio(servicio: {
  id: string;
  name: string;
  duration: number;
  sede_id: string;
  color?: string;
  is_active?: boolean;
}) {
  const { data, error } = await supabase
    .from('servicios')
    .insert({
      ...servicio,
      is_active: servicio.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando servicio:', error);
    throw error;
  }

  return data;
}

/**
 * Obtener profesionales
 */
export async function getProfesionales(sedeId?: string) {
  try {
    let query = supabase.from('profesionales').select('*');

    if (sedeId) {
      query = query.eq('sede_id', sedeId);
    }

    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error obteniendo profesionales:', error);
      console.error('Mensaje del error:', error.message);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error inesperado obteniendo profesionales:', err);
    return [];
  }
}

/**
 * Crear un profesional
 */
export async function createProfesional(profesional: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  sede_id: string;
  servicios: string[];
  is_active?: boolean;
}) {
  const { data, error } = await supabase
    .from('profesionales')
    .insert({
      ...profesional,
      is_active: profesional.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando profesional:', error);
    throw error;
  }

  return data;
}

/**
 * Obtener usuarios
 */
export async function getUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo usuarios:', error);
    return [];
  }

  return data || [];
}

/**
 * Crear un usuario
 */
export async function createUsuario(usuario: {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'recepcionista' | 'usuario';
  sede_id?: string;
}) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      ...usuario,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando usuario:', error);
    throw error;
  }

  return data;
}

/**
 * Obtener colas
 */
export async function getColas(servicioId?: string) {
  let query = supabase.from('colas').select('*');

  if (servicioId) {
    query = query.eq('servicio_id', servicioId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error obteniendo colas:', error);
    return [];
  }

  return data || [];
}

/**
 * Actualizar una cola
 */
export async function updateCola(id: string, updates: Partial<any>) {
  const { data, error } = await supabase
    .from('colas')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando cola:', error);
    throw error;
  }

  return data;
}

/**
 * Obtener recursos
 */
export async function getRecursos(sedeId?: string) {
  let query = supabase.from('recursos').select('*');

  if (sedeId) {
    query = query.eq('sede_id', sedeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error obteniendo recursos:', error);
    return [];
  }

  return data || [];
}

// ============================================
// MÓDULO DE ROLES Y PERMISOS
// ============================================

/**
 * Obtener todos los roles
 */
export async function getRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('nivel', { ascending: false });

  if (error) {
    console.error('Error obteniendo roles:', error);
    return [];
  }

  return data || [];
}

/**
 * Crear un nuevo rol
 */
export async function createRol(rol: {
  nombre: string;
  descripcion?: string;
  nivel: number;
}) {
  const { data, error } = await supabase
    .from('roles')
    .insert({
      ...rol,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando rol:', error);
    throw error;
  }

  return data;
}

/**
 * Actualizar un rol
 */
export async function updateRol(id: string, updates: Partial<any>) {
  const { data, error } = await supabase
    .from('roles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando rol:', error);
    throw error;
  }

  return data;
}

/**
 * Eliminar un rol
 */
export async function deleteRol(id: string) {
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando rol:', error);
    throw error;
  }

  return true;
}

/**
 * Obtener todos los permisos
 */
export async function getPermisos() {
  const { data, error } = await supabase
    .from('permisos')
    .select('*')
    .order('modulo');

  if (error) {
    console.error('Error obteniendo permisos:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtener permisos de un rol
 */
export async function getPermisosDeRol(roleId: string) {
  const { data, error } = await supabase
    .from('roles_permisos')
    .select('*, permisos(*)')
    .eq('role_id', roleId);

  if (error) {
    console.error('Error obteniendo permisos del rol:', error);
    return [];
  }

  return data || [];
}

/**
 * Asignar permisos a un rol
 */
export async function asignarPermisoARol(roleId: string, permisoId: string) {
  const { data, error } = await supabase
    .from('roles_permisos')
    .insert({
      role_id: roleId,
      permiso_id: permisoId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error asignando permiso:', error);
    throw error;
  }

  return data;
}

/**
 * Remover permiso de un rol
 */
export async function removerPermisoDeRol(roleId: string, permisoId: string) {
  const { error } = await supabase
    .from('roles_permisos')
    .delete()
    .eq('role_id', roleId)
    .eq('permiso_id', permisoId);

  if (error) {
    console.error('Error removiendo permiso:', error);
    throw error;
  }

  return true;
}

// ============================================
// MÓDULO DE DISPONIBILIDAD
// ============================================

/**
 * Obtener disponibilidades
 */
export async function getDisponibilidades(profesionalId?: string) {
  let query = supabase.from('disponibilidad').select('*');

  if (profesionalId) {
    query = query.eq('profesional_id', profesionalId);
  }

  const { data, error } = await query.order('fecha_inicio');

  if (error) {
    console.error('Error obteniendo disponibilidades:', error);
    return [];
  }

  return data || [];
}

/**
 * Crear una disponibilidad
 */
export async function createDisponibilidad(disponibilidad: {
  profesional_id: string;
  sede_id?: string;
  tipo: 'jornada' | 'ausencia' | 'festivo' | 'vacacion';
  dia_semana?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  hora_inicio?: string;
  hora_fin?: string;
  motivo?: string;
  recurrente?: boolean;
}) {
  const { data, error } = await supabase
    .from('disponibilidad')
    .insert({
      ...disponibilidad,
      recurrente: disponibilidad.recurrente ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando disponibilidad:', error);
    throw error;
  }

  return data;
}

/**
 * Actualizar una disponibilidad
 */
export async function updateDisponibilidad(id: string, updates: Partial<any>) {
  const { data, error } = await supabase
    .from('disponibilidad')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando disponibilidad:', error);
    throw error;
  }

  return data;
}

/**
 * Eliminar una disponibilidad
 */
export async function deleteDisponibilidad(id: string) {
  const { error } = await supabase
    .from('disponibilidad')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando disponibilidad:', error);
    throw error;
  }

  return true;
}

/**
 * Obtener horarios especiales
 */
export async function getHorariosEspeciales(sedeId?: string) {
  let query = supabase.from('horarios_especiales').select('*');

  if (sedeId) {
    query = query.eq('sede_id', sedeId);
  }

  const { data, error } = await query.order('fecha');

  if (error) {
    console.error('Error obteniendo horarios especiales:', error);
    return [];
  }

  return data || [];
}

/**
 * Crear un horario especial
 */
export async function createHorarioEspecial(horario: {
  sede_id: string;
  nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  es_festivo?: boolean;
  descripcion?: string;
}) {
  const { data, error } = await supabase
    .from('horarios_especiales')
    .insert({
      ...horario,
      es_festivo: horario.es_festivo ?? false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando horario especial:', error);
    throw error;
  }

  return data;
}

// ============================================
// MÓDULO DE PLANTILLAS DE MENSAJES
// ============================================

/**
 * Obtener plantillas de mensajes
 */
export async function getPlantillas(filtros?: { tipo?: string; activa?: boolean }) {
  let query = supabase.from('plantillas_mensajes').select('*');

  if (filtros?.tipo) {
    query = query.eq('tipo', filtros.tipo);
  }

  if (filtros?.activa !== undefined) {
    query = query.eq('activa', filtros.activa);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error obteniendo plantillas:', error);
    return [];
  }

  return data || [];
}

/**
 * Crear una plantilla
 */
export async function createPlantilla(plantilla: {
  nombre: string;
  tipo: 'email' | 'sms' | 'whatsapp' | 'push';
  categoria: string;
  asunto?: string;
  contenido: string;
  variables_disponibles?: string[];
  activa?: boolean;
}) {
  const { data, error } = await supabase
    .from('plantillas_mensajes')
    .insert({
      ...plantilla,
      variables_disponibles: plantilla.variables_disponibles || [],
      activa: plantilla.activa ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando plantilla:', error);
    throw error;
  }

  return data;
}

/**
 * Actualizar una plantilla
 */
export async function updatePlantilla(id: string, updates: Partial<any>) {
  const { data, error } = await supabase
    .from('plantillas_mensajes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando plantilla:', error);
    throw error;
  }

  return data;
}

/**
 * Eliminar una plantilla
 */
export async function deletePlantilla(id: string) {
  const { error } = await supabase
    .from('plantillas_mensajes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando plantilla:', error);
    throw error;
  }

  return true;
}

/**
 * Obtener configuración del sistema
 */
export async function getConfiguracion(clave?: string) {
  try {
    let query = supabase.from('configuracion').select('*');
    
    if (clave) {
      query = query.eq('clave', clave);
    }
    
    const { data, error } = await query.order('clave', { ascending: true });
    
    if (error) {
      console.error('Error obteniendo configuración:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error inesperado obteniendo configuración:', err);
    return [];
  }
}

/**
 * Obtener un valor de configuración específico
 */
export async function getConfiguracionValue(clave: string, defaultValue: any = null) {
  try {
    const { data, error } = await supabase
      .from('configuracion')
      .select('valor, tipo')
      .eq('clave', clave)
      .single();
    
    if (error || !data) {
      console.log(`Configuración ${clave} no encontrada, usando valor por defecto`);
      return defaultValue;
    }
    
    // Convertir según el tipo
    switch (data.tipo) {
      case 'number':
        return Number(data.valor);
      case 'boolean':
        return data.valor === 'true';
      case 'json':
        return JSON.parse(data.valor);
      default:
        return data.valor;
    }
  } catch (err) {
    console.error(`Error obteniendo configuración ${clave}:`, err);
    return defaultValue;
  }
}

/**
 * Actualizar o crear configuración
 */
export async function setConfiguracion(clave: string, valor: any, tipo: string = 'string', descripcion?: string) {
  try {
    // Convertir valor según tipo
    let valorStr: string;
    switch (tipo) {
      case 'json':
        valorStr = JSON.stringify(valor);
        break;
      default:
        valorStr = String(valor);
    }
    
    // Intentar actualizar primero
    const { data: existing, error: searchError } = await supabase
      .from('configuracion')
      .select('id')
      .eq('clave', clave)
      .single();
    
    if (existing && !searchError) {
      // Actualizar existente
      const { data, error } = await supabase
        .from('configuracion')
        .update({
          valor: valorStr,
          updated_at: new Date().toISOString()
        })
        .eq('clave', clave)
        .select()
        .single();
      
      if (error) {
        console.error('Error actualizando configuración:', error);
        throw error;
      }
      
      return data;
    } else {
      // Crear nuevo
      const { data, error } = await supabase
        .from('configuracion')
        .insert({
          clave,
          valor: valorStr,
          tipo,
          descripcion
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creando configuración:', error);
        throw error;
      }
      
      return data;
    }
  } catch (err) {
    console.error('Error inesperado en setConfiguracion:', err);
    throw err;
  }
}
