import { supabase } from "@/lib/supabase";

export interface QRCheckInData {
  qrCode: string;
  ipAddress?: string;
  userAgent?: string;
  dispositivo?: string;
}

export interface QRCheckInResult {
  success: boolean;
  message: string;
  citaId?: string;
  turnoId?: string;
  data?: any;
}

/**
 * Verifica y registra un check-in mediante código QR
 */
export async function verificarQRCheckIn(data: QRCheckInData): Promise<QRCheckInResult> {
  try {
    // Obtener información de la cita o turno desde el QR
    const qrData = await obtenerDatosDelQR(data.qrCode);
    
    if (!qrData) {
      return {
        success: false,
        message: "Código QR inválido o expirado",
      };
    }

    // Validar que no esté usado
    const yaUsado = await verificarQRYaUsado(data.qrCode);
    if (yaUsado) {
      // Log del intento fallido
      await registrarLogQR({
        ...data,
        resultado: "usado",
        citaId: qrData.citaId,
        turnoId: qrData.turnoId,
        usuarioId: qrData.usuarioId,
      });

      return {
        success: false,
        message: "Este código QR ya ha sido utilizado",
      };
    }

    // Validar ventana de tiempo para check-in
    const dentroVentana = await validarVentanaCheckIn(qrData);
    if (!dentroVentana.valid) {
      await registrarLogQR({
        ...data,
        resultado: "vencido",
        citaId: qrData.citaId,
        turnoId: qrData.turnoId,
        usuarioId: qrData.usuarioId,
      });

      return {
        success: false,
        message: dentroVentana.message,
      };
    }

    // Registrar check-in exitoso
    if (qrData.citaId) {
      await registrarCheckInCita(qrData.citaId, new Date().toISOString());
    }

    // Log del check-in exitoso
    await registrarLogQR({
      ...data,
      resultado: "exitoso",
      citaId: qrData.citaId,
      turnoId: qrData.turnoId,
      usuarioId: qrData.usuarioId,
    });

    return {
      success: true,
      message: "Check-in registrado exitosamente",
      citaId: qrData.citaId,
      turnoId: qrData.turnoId,
      data: qrData,
    };
  } catch (error) {
    console.error("Error en verificación QR:", error);
    return {
      success: false,
      message: "Error al procesar el check-in",
    };
  }
}

/**
 * Obtiene los datos de la cita o turno desde el código QR
 */
async function obtenerDatosDelQR(qrCode: string) {
  try {
    // Buscar en citas
    const { data: cita } = await supabase
      .from("citas")
      .select("id, user_id, fecha, hora")
      .eq("qr_code", qrCode)
      .single();

    if (cita) {
      return {
        citaId: cita.id,
        usuarioId: cita.user_id,
        fecha: cita.fecha,
        hora: cita.hora,
      };
    }

    // Buscar en turnos
    const { data: turno } = await supabase
      .from("turnos")
      .select("id, user_id, creado_at")
      .eq("qr_code", qrCode)
      .single();

    if (turno) {
      return {
        turnoId: turno.id,
        usuarioId: turno.user_id,
        creadoAt: turno.creado_at,
      };
    }

    return null;
  } catch (error) {
    console.error("Error obteniendo datos QR:", error);
    return null;
  }
}

/**
 * Verifica si el QR ya fue usado
 */
async function verificarQRYaUsado(qrCode: string): Promise<boolean> {
  const { data } = await supabase
    .from("logs_qr")
    .select("resultado")
    .eq("qr_code", qrCode)
    .eq("resultado", "exitoso")
    .single();

  return !!data;
}

/**
 * Valida la ventana de tiempo para check-in
 */
async function validarVentanaCheckIn(data: any) {
  // Obtener configuración de ventana de check-in
  const { data: config } = await supabase
    .from("configuracion_sistema")
    .select("valor")
    .eq("clave", "ventana_checkin_minutos")
    .single();

  const ventanaMinutos = config?.valor || 15;

  if (data.fecha && data.hora) {
    const fechaHoraCita = new Date(`${data.fecha}T${data.hora}`);
    const ahora = new Date();
    const diffMinutos = (fechaHoraCita.getTime() - ahora.getTime()) / (1000 * 60);

    // Permitir check-in hasta X minutos antes de la cita
    if (diffMinutos < -ventanaMinutos || diffMinutos > 0) {
      return {
        valid: false,
        message: `Check-in permitido solo ${ventanaMinutos} minutos antes de la cita`,
      };
    }
  }

  return { valid: true, message: "OK" };
}

/**
 * Registra el check-in de la cita
 */
async function registrarCheckInCita(citaId: string, timestamp: string) {
  // Al hacer check-in con QR, la cita queda en 'confirmada' esperando ser atendida
  // El recepcionista luego la cambia a 'en_curso' cuando inicia la atención
  await supabase
    .from("citas")
    .update({
      hora_checkin: timestamp,
      updated_at: new Date().toISOString(),
    })
    .eq("id", citaId);
}

/**
 * Registra un log de escaneo QR
 */
async function registrarLogQR(data: QRCheckInData & any) {
  await supabase.from("logs_qr").insert({
    qr_code: data.qrCode,
    cita_id: data.citaId,
    turno_id: data.turnoId,
    usuario_id: data.usuarioId,
    ip_address: data.ipAddress,
    user_agent: data.userAgent,
    dispositivo: data.dispositivo,
    resultado: data.resultado,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Obtiene los logs de QR para auditoría
 */
export async function obtenerLogsQR(filtros?: {
  fechaDesde?: string;
  fechaHasta?: string;
  resultado?: string;
}) {
  let query = supabase.from("logs_qr").select("*").order("timestamp", { ascending: false });

  if (filtros?.fechaDesde) {
    query = query.gte("timestamp", filtros.fechaDesde);
  }

  if (filtros?.fechaHasta) {
    query = query.lte("timestamp", filtros.fechaHasta);
  }

  if (filtros?.resultado) {
    query = query.eq("resultado", filtros.resultado);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}
