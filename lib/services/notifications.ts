import { mockUsers } from '@/lib/data';

export interface NotificationOptions {
  to: string;
  subject: string;
  message: string;
  type: 'email' | 'sms';
}

/**
 * Servicio de notificaciones mock
 * En producción, aquí se integraría con servicios reales como SendGrid, Twilio, etc.
 */
export class NotificationService {
  /**
   * Envía una notificación por email o SMS
   */
  static async send(options: NotificationOptions): Promise<boolean> {
    try {
      console.log(`📧 Enviando ${options.type.toUpperCase()} a ${options.to}`);
      console.log(`📋 Asunto: ${options.subject}`);
      console.log(`📝 Mensaje: ${options.message}`);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // En producción, aquí se haría la llamada real al servicio
      return true;
    } catch (error) {
      console.error('Error enviando notificación:', error);
      return false;
    }
  }

  /**
   * Notifica confirmación de cita
   */
  static async notifyCitaConfirmada(
    userId: string,
    cita: {
      servicio: string;
      fecha: string;
      hora: string;
      profesional: string;
      id?: string;
      confirmationToken?: string;
    }
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return false;

    // Construir enlaces de confirmación/cancelación
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const confirmLink = `${baseUrl}/api/citas/${cita.id}/confirmar?token=${cita.confirmationToken}`;
    const cancelLink = `${baseUrl}/api/citas/${cita.id}/cancelar?token=${cita.confirmationToken}`;

    const message = `
Estimado/a ${user.name},

Su cita ha sido confirmada:

📅 Servicio: ${cita.servicio}
👨‍⚕️ Profesional: ${cita.profesional}
📆 Fecha: ${cita.fecha}
🕐 Hora: ${cita.hora}

Si necesitas modificar tu cita, puedes hacerlo desde los siguientes enlaces:

✅ Confirmar: ${confirmLink}
❌ Cancelar: ${cancelLink}

O ingresa a tu cuenta en la app.

Por favor, presente su código QR en la recepción.

Saludos,
Equipo ReservaFlow
    `.trim();

    return await this.send({
      to: user.email,
      subject: 'Cita confirmada - ReservaFlow',
      message,
      type: 'email',
    });
  }

  /**
   * Notifica recordatorio de cita
   */
  static async notifyRecordatorio(
    userId: string,
    cita: { servicio: string; fecha: string; hora: string }
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return false;

    const message = `
Hola ${user.name},

Le recordamos su cita:

📅 Servicio: ${cita.servicio}
📆 Fecha: ${cita.fecha}
🕐 Hora: ${cita.hora}

¡Nos vemos pronto!

Equipo ReservaFlow
    `.trim();

    return await this.send({
      to: user.email,
      subject: 'Recordatorio de cita - ReservaFlow',
      message,
      type: 'email',
    });
  }

  /**
   * Notifica turno obtenido
   */
  static async notifyTurnoObtenido(
    userId: string,
    turno: { numero: number; servicio: string; tiempoEstimado: number }
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return false;

    const message = `
${user.name}, tu turno #${turno.numero} está listo.

📋 Servicio: ${turno.servicio}
⏱️ Tiempo estimado: ${turno.tiempoEstimado} minutos

Presenta tu código QR en la recepción.

Equipo ReservaFlow
    `.trim();

    return await this.send({
      to: user.email,
      subject: `Turno #${turno.numero} - ReservaFlow`,
      message,
      type: 'email',
    });
  }
}
