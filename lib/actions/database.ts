import { supabase } from '@/lib/supabase';

/**
 * Obtener todas las citas
 */
export async function getCitas(filters?: { userId?: string; estado?: string }) {
  try {
    console.log('🔍 Iniciando consulta de citas con filtros:', filters);
    
    // Obtener todas las citas
    let query = supabase.from('citas').select('*');

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error obteniendo citas:', error);
      console.error('Mensaje del error:', error.message);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      return [];
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No hay citas en la base de datos');
      return [];
    }

    console.log('📊 Datos de citas obtenidos:', data.length, 'registros');
    
    // Obtener nombres de usuarios para las citas que tienen user_id
    const userIds = [...new Set(data.filter(c => c.user_id).map(c => c.user_id))];
    const usuariosMap = new Map();
    
    if (userIds.length > 0) {
      const { data: usuarios, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, name, email')
        .in('id', userIds);
      
      if (!usuariosError && usuarios) {
        usuarios.forEach(u => usuariosMap.set(u.id, u));
        console.log('✅ Nombres de usuarios obtenidos:', usuarios.length);
      } else {
        console.warn('⚠️ No se pudieron obtener los nombres de usuarios:', usuariosError);
      }
    }
    
    // Mapear nombres de usuario a las citas
    const citasConNombre = data.map(cita => ({
      ...cita,
      user_name: usuariosMap.get(cita.user_id)?.name || null,
      user_email: usuariosMap.get(cita.user_id)?.email || null
    }));

    if (citasConNombre.length > 0) {
      console.log('✅ Primeras 3 citas:', citasConNombre.slice(0, 3).map(c => ({
        id: c.id,
        paciente: c.paciente_name || c.user_name || 'Sin nombre',
        fecha: c.fecha,
        estado: c.estado
      })));
    }

    return citasConNombre;
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
  profesional_id?: string;
  profesional?: string;
  fecha: string;
  hora: string;
  motivo?: string;
  paciente_name?: string;
  skipLimitValidation?: boolean; // Si es true, omite la validación del límite de citas (para recepcionistas/admins)
}) {
  // Verificar que el usuario existe en la tabla usuarios y obtener su rol
  let userRole: string | null = null;
  if (cita.user_id) {
    const { data: userExists, error: userError } = await supabase
      .from('usuarios')
      .select('id, role')
      .eq('id', cita.user_id)
      .single();

    if (userError || !userExists) {
      console.error('❌ Error: El usuario no existe en la tabla usuarios:', {
        user_id: cita.user_id,
        error: userError?.message || 'Usuario no encontrado'
      });
      
      // Mensaje de error más claro para el usuario
      const errorMessage = userError?.code === 'PGRST116' 
        ? 'Tu perfil de usuario no está completo. Por favor, cierra sesión y vuelve a iniciar sesión para actualizar tu perfil.'
        : 'El usuario no existe en el sistema. Por favor, contacta al administrador o intenta cerrar sesión y volver a iniciar sesión.';
      
      throw new Error(errorMessage);
    }

    userRole = userExists.role;
  }

  // Validar límite de citas activas por usuario (solo para usuarios regulares, no para recepcionistas ni admins)
  // Si skipLimitValidation es true, omitir esta validación (para cuando recepcionistas/admins crean citas)
  if (!cita.skipLimitValidation && userRole === 'usuario') {
    const { validarLimiteCitasActivas } = await import('@/lib/utils/cita-validations');
    const citasUsuario = await getCitas({ userId: cita.user_id });
    const citasActivas = citasUsuario.filter((c: any) => 
      c.estado === 'confirmada' && 
      new Date(`${c.fecha}T${c.hora}`) > new Date()
    );
    
    const validacionLimite = validarLimiteCitasActivas(citasActivas.length);
    if (!validacionLimite.puede) {
      throw new Error(validacionLimite.razon || 'Límite de citas activas alcanzado');
    }
  }

  // Generar ID único
  const newId = `CT-${String(Date.now()).slice(-6)}`;

  // Generar token único para confirmación/cancelación por email
  const confirmationToken = crypto.randomUUID();

  console.log('📝 Creando cita con datos:', {
    user_id: cita.user_id,
    sede_id: cita.sede_id,
    servicio_id: cita.servicio_id,
    profesional_id: cita.profesional_id
  });

  // Preparar datos para insertar, omitiendo campos undefined
  const dataToInsert: any = {
    id: newId,
    user_id: cita.user_id,
    sede_id: cita.sede_id,
    servicio_id: cita.servicio_id,
    servicio: cita.servicio,
    fecha: cita.fecha,
    hora: cita.hora,
    estado: 'confirmada',
    confirmation_token: confirmationToken,
    // Generar QR code automáticamente
    qr_code: `CITA-${newId}-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Solo incluir profesional_id y profesional si están definidos y no están vacíos
  if (cita.profesional_id && cita.profesional_id.trim() !== '') {
    dataToInsert.profesional_id = cita.profesional_id;
  }
  if (cita.profesional && cita.profesional.trim() !== '') {
    dataToInsert.profesional = cita.profesional;
  }
  if (cita.motivo && cita.motivo.trim() !== '') {
    dataToInsert.motivo = cita.motivo;
  }
  // Intentar agregar paciente_name solo si existe y tiene valor
  // Nota: Esta columna debe existir en la BD (ejecutar scripts/agregar-paciente-name-citas.sql)
  if (cita.paciente_name && cita.paciente_name.trim() !== '') {
    dataToInsert.paciente_name = cita.paciente_name;
  }

  const { data, error } = await supabase
    .from('citas')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    // Si el error es porque la columna paciente_name no existe, intentar sin ese campo
    if (error.message && error.message.includes("paciente_name") && error.message.includes("schema cache")) {
      console.warn('⚠️ La columna paciente_name no existe en la BD. Intentando crear cita sin ese campo...');
      // Remover paciente_name y reintentar
      delete dataToInsert.paciente_name;
      
      const { data: retryData, error: retryError } = await supabase
        .from('citas')
        .insert(dataToInsert)
        .select()
        .single();
      
      if (retryError) {
        console.error('Error creando cita (intento sin paciente_name):', retryError);
        console.error('Mensaje del error:', retryError.message);
        console.error('Detalles del error:', JSON.stringify(retryError, null, 2));
        console.error('Datos que se intentaron insertar:', JSON.stringify(dataToInsert, null, 2));
        throw retryError;
      }
      
      // Retornar los datos pero con un warning
      console.warn('⚠️ Cita creada sin paciente_name. Ejecuta el script: scripts/agregar-paciente-name-citas.sql');
      return { ...retryData, confirmationToken, paciente_name: cita.paciente_name || null };
    }
    
    console.error('Error creando cita:', error);
    console.error('Mensaje del error:', error.message);
    console.error('Detalles del error:', JSON.stringify(error, null, 2));
    console.error('Datos que se intentaron insertar:', JSON.stringify(dataToInsert, null, 2));
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
 * Regenerar QR de una cita
 * Invalida el QR anterior y genera uno nuevo
 */
export async function regenerateQRCita(citaId: string) {
  try {
    // Invalidar QR anterior marcándolo como anulado en logs
    const { data: citaExistente } = await supabase
      .from('citas')
      .select('qr_code, user_id')
      .eq('id', citaId)
      .single();

    if (!citaExistente) {
      throw new Error('Cita no encontrada');
    }

    // Marcar QR anterior como anulado en logs
    if (citaExistente.qr_code) {
      await supabase
        .from('logs_qr')
        .insert({
          qr_code: citaExistente.qr_code,
          cita_id: citaId,
          usuario_id: citaExistente.user_id,
          ip_address: 'system',
          user_agent: 'system',
          dispositivo: 'system',
          resultado: 'anulado',
          timestamp: new Date().toISOString(),
        });
    }

    // Generar nuevo QR
    const nuevoQR = `CITA-${citaId}-${Date.now()}`;

    // Actualizar cita con nuevo QR
    const { data, error } = await supabase
      .from('citas')
      .update({
        qr_code: nuevoQR,
        updated_at: new Date().toISOString(),
      })
      .eq('id', citaId)
      .select()
      .single();

    if (error) {
      console.error('Error regenerando QR:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error en regenerateQRCita:', error);
    throw error;
  }
}

/**
 * Regenerar QR de un turno
 * Invalida el QR anterior y genera uno nuevo
 */
export async function regenerateQRTurno(turnoId: string) {
  try {
    // Invalidar QR anterior marcándolo como anulado en logs
    const { data: turnoExistente } = await supabase
      .from('turnos')
      .select('qr_code, user_id')
      .eq('id', turnoId)
      .single();

    if (!turnoExistente) {
      throw new Error('Turno no encontrado');
    }

    // Marcar QR anterior como anulado en logs
    if (turnoExistente.qr_code) {
      await supabase
        .from('logs_qr')
        .insert({
          qr_code: turnoExistente.qr_code,
          turno_id: turnoId,
          usuario_id: turnoExistente.user_id,
          ip_address: 'system',
          user_agent: 'system',
          dispositivo: 'system',
          resultado: 'anulado',
          timestamp: new Date().toISOString(),
        });
    }

    // Generar nuevo QR
    const nuevoQR = `TURNO-${turnoId}-${Date.now()}`;

    // Actualizar turno con nuevo QR
    const { data, error } = await supabase
      .from('turnos')
      .update({
        qr_code: nuevoQR,
        updated_at: new Date().toISOString(),
      })
      .eq('id', turnoId)
      .select()
      .single();

    if (error) {
      console.error('Error regenerando QR:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error en regenerateQRTurno:', error);
    throw error;
  }
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
      tipo: 'digital', // Turnos desde la app son digitales
      creado_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Generar QR code automáticamente
      qr_code: `TURNO-${newId}-${Date.now()}`,
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
 * Eliminar un turno
 */
export async function deleteTurno(id: string) {
  const { error } = await supabase
    .from('turnos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando turno:', error);
    throw error;
  }

  return true;
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
 * Actualizar una sede
 */
export async function updateSede(id: string, updates: Partial<{
  name: string;
  address: string;
  phone: string;
  is_active?: boolean;
}>) {
  const { data, error } = await supabase
    .from('sedes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando sede:', error);
    throw error;
  }

  return data;
}

/**
 * Eliminar una sede
 */
export async function deleteSede(id: string) {
  const { error } = await supabase
    .from('sedes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando sede:', error);
    throw error;
  }

  return true;
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
 * Actualizar un servicio
 */
export async function updateServicio(id: string, updates: Partial<{
  name: string;
  duration: number;
  sede_id: string;
  color?: string;
  is_active?: boolean;
}>) {
  const { data, error } = await supabase
    .from('servicios')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando servicio:', error);
    throw error;
  }

  return data;
}

/**
 * Eliminar un servicio
 */
export async function deleteServicio(id: string) {
  const { error } = await supabase
    .from('servicios')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando servicio:', error);
    throw error;
  }

  return true;
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
 * Obtener un profesional por ID
 */
export async function getProfesionalById(profesionalId: string) {
  try {
    const { data, error } = await supabase
      .from('profesionales')
      .select('*')
      .eq('id', profesionalId)
      .single();

    if (error) {
      console.error('Error obteniendo profesional:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error inesperado obteniendo profesional:', err);
    return null;
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
 * Actualizar un profesional
 */
export async function updateProfesional(id: string, updates: Partial<{
  name: string;
  email: string;
  phone?: string;
  sede_id: string;
  servicios: string[];
  is_active?: boolean;
}>) {
  const { data, error } = await supabase
    .from('profesionales')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando profesional:', error);
    throw error;
  }

  return data;
}

/**
 * Eliminar un profesional
 */
export async function deleteProfesional(id: string) {
  const { error } = await supabase
    .from('profesionales')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando profesional:', error);
    throw error;
  }

  return true;
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
  id?: string;
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'recepcionista' | 'usuario';
  sede_id?: string;
  email_verificado?: boolean;
}) {
  // Generar UUID si no se proporciona (la tabla espera UUID)
  let userId = usuario.id;
  if (!userId) {
    // Generar UUID v4
    userId = crypto.randomUUID();
  }

  // Preparar datos para insertar
  const dataToInsert: any = {
    id: userId,
    email: usuario.email,
    name: usuario.name,
    password: usuario.password,
    role: usuario.role,
    sede_id: usuario.sede_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
  };

  // Solo agregar email_verificado si el campo existe en la tabla
  // (puede que no exista si no se ejecutó el script de agregar-verificacion-email.sql)
  if (usuario.email_verificado !== undefined) {
    dataToInsert.email_verificado = usuario.email_verificado;
  } else if (usuario.role !== 'usuario') {
    // Para admin y recepcionista, intentar establecer email_verificado como true
    dataToInsert.email_verificado = true;
  }

  const { data, error } = await supabase
    .from('usuarios')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error creando usuario:', error);
    console.error('Detalles del error:', JSON.stringify(error, null, 2));
    console.error('Datos que se intentaron insertar:', {
      id: userId,
      email: usuario.email,
      name: usuario.name,
      role: usuario.role,
      email_verificado: usuario.email_verificado ?? (usuario.role === 'usuario' ? false : true),
    });
    throw error;
  }

  return data;
}

/**
 * Actualizar un usuario
 */
export async function updateUsuario(id: string, updates: Partial<{
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'recepcionista' | 'usuario';
  sede_id?: string | null;
  email_verificado?: boolean;
}>) {
  const dataToUpdate: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  // Solo actualizar password si se proporciona
  if (updates.password !== undefined) {
    if (updates.password && updates.password.trim() !== '') {
      dataToUpdate.password = updates.password;
    }
  } else {
    // Si no se proporciona password, no actualizarlo
    delete dataToUpdate.password;
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update(dataToUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando usuario:', error);
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
 * Crear una cola
 */
export async function createCola(cola: {
  name: string;
  servicio_id: string;
  prioridad: 'alta' | 'media' | 'baja';
  is_active?: boolean;
  tiempo_estimado_total?: number;
}) {
  const newId = `COL-${String(Date.now()).slice(-6)}`;

  const { data, error } = await supabase
    .from('colas')
    .insert({
      id: newId,
      name: cola.name,
      servicio_id: cola.servicio_id,
      prioridad: cola.prioridad,
      is_active: cola.is_active ?? true,
      is_cerrada: false,
      turnos_actuales: 0,
      tiempo_estimado_total: cola.tiempo_estimado_total || 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando cola:', error);
    throw error;
  }

  return data;
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
 * Eliminar una cola
 */
export async function deleteCola(id: string) {
  const { error } = await supabase
    .from('colas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando cola:', error);
    throw error;
  }

  return true;
}

/**
 * Obtener recursos
 */
export async function getRecursos(sedeId?: string) {
  try {
  let query = supabase.from('recursos').select('*');

  if (sedeId) {
    query = query.eq('sede_id', sedeId);
  }

    const { data, error } = await query.order('name');

  if (error) {
    console.error('Error obteniendo recursos:', error);
    return [];
  }

  return data || [];
  } catch (err) {
    console.error('Error inesperado obteniendo recursos:', err);
    return [];
  }
}

/**
 * Crear un recurso
 */
export async function createRecurso(recurso: {
  id: string;
  name: string;
  tipo: 'consultorio' | 'sala' | 'equipo' | 'vehiculo';
  sede_id: string;
  servicios?: string[];
  is_active?: boolean;
}) {
  const { data, error } = await supabase
    .from('recursos')
    .insert({
      ...recurso,
      servicios: recurso.servicios || [],
      is_active: recurso.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creando recurso:', error);
    throw error;
  }

  return data;
}

/**
 * Actualizar un recurso
 */
export async function updateRecurso(id: string, updates: Partial<{
  name: string;
  tipo: 'consultorio' | 'sala' | 'equipo' | 'vehiculo';
  sede_id: string;
  servicios?: string[];
  is_active?: boolean;
}>) {
  const { data, error } = await supabase
    .from('recursos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error actualizando recurso:', error);
    throw error;
  }

  return data;
}

/**
 * Eliminar un recurso
 */
export async function deleteRecurso(id: string) {
  const { error } = await supabase
    .from('recursos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando recurso:', error);
    throw error;
  }

  return true;
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
 * Obtener o crear un rol por nombre (asegura que existan los roles básicos)
 */
export async function getOrCreateRolPorNombre(nombreRol: string): Promise<any> {
  // Normalizar el nombre del rol
  const nombresNormalizados: { [key: string]: string } = {
    'admin': 'Administrador',
    'administrador': 'Administrador',
    'recepcionista': 'Recepcionista',
    'usuario': 'Usuario',
  };

  const nombreNormalizado = nombresNormalizados[nombreRol.toLowerCase()] || nombreRol;

  // Buscar el rol
  const { data: rolesExistentes, error: searchError } = await supabase
    .from('roles')
    .select('*')
    .ilike('nombre', nombreNormalizado)
    .limit(1);

  if (searchError) {
    console.error('Error buscando rol:', searchError);
    throw searchError;
  }

  // Si existe, retornarlo
  if (rolesExistentes && rolesExistentes.length > 0) {
    return rolesExistentes[0];
  }

  // Si no existe, crearlo
  const niveles: { [key: string]: number } = {
    'Administrador': 10,
    'Recepcionista': 5,
    'Usuario': 1,
  };

  const descripciones: { [key: string]: string } = {
    'Administrador': 'Acceso completo al sistema',
    'Recepcionista': 'Atención al cliente y gestión de citas',
    'Usuario': 'Acceso básico del paciente',
  };

  const { data: nuevoRol, error: createError } = await supabase
    .from('roles')
    .insert({
      nombre: nombreNormalizado,
      descripcion: descripciones[nombreNormalizado] || `Rol de ${nombreNormalizado}`,
      nivel: niveles[nombreNormalizado] || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creando rol:', createError);
    throw createError;
  }

  return nuevoRol;
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

  // Transformar los permisos para que tengan un campo 'nombre' para compatibilidad
  return (data || []).map((permiso: any) => ({
    ...permiso,
    nombre: `${permiso.modulo} - ${permiso.accion}`,
  }));
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

  if (!data || data.length === 0) {
    return [];
  }

  // Extraer los permisos de la estructura anidada y filtrar nulls/undefined
  const permisos = (data || [])
    .map((rp: any) => rp.permisos)
    .filter((p: any) => p !== null && p !== undefined && p !== false);
  
  return permisos;
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

/**
 * Verificar si un usuario tiene un permiso específico
 * @param userId ID del usuario
 * @param modulo Módulo del permiso (ej: 'profesionales', 'citas')
 * @param accion Acción del permiso (ej: 'crear', 'editar', 'eliminar')
 * @returns true si el usuario tiene el permiso, false en caso contrario
 */
export async function hasPermission(userId: string, modulo: string, accion: string): Promise<boolean> {
  try {
    // Obtener el usuario y su rol
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !usuario) {
      console.error('Error obteniendo usuario:', userError);
      return false;
    }

    // Si es admin, tiene todos los permisos
    const userRole = usuario.role?.toLowerCase();
    if (userRole === 'admin' || userRole === 'administrador') {
      return true;
    }

    // Obtener o crear el rol del usuario
    const rolUsuario = await getOrCreateRolPorNombre(usuario.role);

    // Buscar el permiso por módulo y acción
    const { data: permiso, error: permisoError } = await supabase
      .from('permisos')
      .select('id')
      .eq('modulo', modulo)
      .eq('accion', accion)
      .single();

    if (permisoError || !permiso) {
      console.warn(`Permiso no encontrado: ${modulo} - ${accion}`);
      return false;
    }

    // Verificar si el rol tiene el permiso
    const { data: rolPermiso, error: rolPermisoError } = await supabase
      .from('roles_permisos')
      .select('id')
      .eq('role_id', rolUsuario.id)
      .eq('permiso_id', permiso.id)
      .single();

    if (rolPermisoError || !rolPermiso) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verificando permiso:', error);
    return false;
  }
}

/**
 * Obtener todos los permisos de un usuario
 * @param userId ID del usuario
 * @returns Array de permisos con formato { modulo, accion }
 */
export async function getUserPermissions(userId: string): Promise<Array<{ modulo: string; accion: string }>> {
  try {
    // Obtener el usuario y su rol
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !usuario) {
      console.error('Error obteniendo usuario:', userError);
      return [];
    }

    // Si es admin, retornar todos los permisos posibles
    const userRole = usuario.role?.toLowerCase();
    if (userRole === 'admin' || userRole === 'administrador') {
      // Obtener todos los permisos disponibles
      const { data: todosPermisos } = await supabase
        .from('permisos')
        .select('modulo, accion');
      
      return todosPermisos || [];
    }

    // Obtener o crear el rol del usuario
    const rolUsuario = await getOrCreateRolPorNombre(usuario.role);

    // Obtener permisos del rol
    const permisosDelRol = await getPermisosDeRol(rolUsuario.id);

    // Extraer módulo y acción
    return permisosDelRol.map((p: any) => ({
      modulo: p.modulo,
      accion: p.accion,
    }));
  } catch (error) {
    console.error('Error obteniendo permisos del usuario:', error);
    return [];
  }
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
  // Limpiar el objeto: eliminar campos undefined y null, y campos que no existen en la tabla
  const datosLimpios: any = {
    profesional_id: disponibilidad.profesional_id,
    tipo: disponibilidad.tipo,
    recurrente: disponibilidad.recurrente ?? false,
  };

  // Agregar sede_id si está presente
  if (disponibilidad.sede_id) {
    datosLimpios.sede_id = disponibilidad.sede_id;
  }

  // Agregar campos opcionales solo si tienen valor
  if (disponibilidad.dia_semana !== undefined && disponibilidad.dia_semana !== null) {
    datosLimpios.dia_semana = disponibilidad.dia_semana;
  }
  if (disponibilidad.fecha_inicio) {
    datosLimpios.fecha_inicio = disponibilidad.fecha_inicio;
  }
  if (disponibilidad.fecha_fin) {
    datosLimpios.fecha_fin = disponibilidad.fecha_fin;
  }
  if (disponibilidad.hora_inicio) {
    datosLimpios.hora_inicio = disponibilidad.hora_inicio;
  }
  if (disponibilidad.hora_fin) {
    datosLimpios.hora_fin = disponibilidad.hora_fin;
  }
  if (disponibilidad.motivo) {
    datosLimpios.motivo = disponibilidad.motivo;
  }

  // Agregar timestamps
  datosLimpios.created_at = new Date().toISOString();
  datosLimpios.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('disponibilidad')
    .insert(datosLimpios)
    .select()
    .single();

  if (error) {
    console.error('Error creando disponibilidad:', {
      error,
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      datosEnviados: datosLimpios
    });
    // Crear un error más descriptivo
    const errorMessage = error.message || error.details || error.hint || 'Error desconocido al crear disponibilidad';
    throw new Error(errorMessage);
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
