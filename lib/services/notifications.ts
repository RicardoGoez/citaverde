import { mockUsers } from '@/lib/data';

export interface NotificationOptions {
  to: string;
  subject: string;
  message: string;
  type: 'email' | 'sms';
  includeQR?: boolean;
  qrData?: string;
  template?: 'cita_confirmada' | 'recordatorio' | 'turno_obtenido';
  templateData?: any;
}

/**
 * Servicio de notificaciones
 * Utiliza la API de email para envío real
 */
export class NotificationService {
  /**
   * Envía una notificación por email o SMS
   */
  static async send(options: NotificationOptions): Promise<boolean> {
    try {
      console.log(`📧 Enviando ${options.type.toUpperCase()} a ${options.to}`);
      console.log(`📋 Asunto: ${options.subject}`);
      
      if (options.type === 'email') {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: options.to,
            subject: options.subject,
            message: options.message,
            type: 'email',
            includeQR: options.includeQR || false,
            qrData: options.qrData,
            template: options.template,
            templateData: options.templateData,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          console.log('✅ Email enviado exitosamente');
          if (data.previewUrl) {
            console.log('🔗 Preview URL:', data.previewUrl);
          }
          return true;
        } else {
          console.error('❌ Error enviando email:', data.message);
          return false;
        }
      }
      
      // SMS no implementado aún
      console.warn('⚠️ SMS no implementado, solo email');
      return false;
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
      qr_code?: string;
    },
    userEmail?: string
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    const email = userEmail || user?.email;
    
    if (!email) {
      console.error('No se encontró email para notificar');
      return false;
    }

    // Construir enlaces de confirmación/cancelación/reprogramación
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const confirmLink = `${baseUrl}/api/citas/${cita.id}/confirmar?token=${cita.confirmationToken}`;
    const cancelLink = `${baseUrl}/api/citas/${cita.id}/cancelar?token=${cita.confirmationToken}`;
    const reprogramarLink = `${baseUrl}/usuario/reprogramar-cita?cita=${cita.id}&token=${cita.confirmationToken}`;

    const message = `
Estimado/a ${user?.name || 'Usuario'},

Su cita ha sido confirmada:

📅 Servicio: ${cita.servicio}
👨‍⚕️ Profesional: ${cita.profesional}
📆 Fecha: ${cita.fecha}
🕐 Hora: ${cita.hora}

Si necesitas modificar tu cita, puedes hacerlo desde los siguientes enlaces:

✅ Confirmar: ${confirmLink}
🔄 Reprogramar: ${reprogramarLink}
❌ Cancelar: ${cancelLink}

O ingresa a tu cuenta en la app.

Por favor, presente su código QR en la recepción.

Saludos,
Equipo ReservaFlow
    `.trim();

    return await this.send({
      to: email,
      subject: 'Cita confirmada - ReservaFlow',
      message,
      type: 'email',
      template: 'cita_confirmada',
      templateData: {
        nombre: user?.name || 'Usuario',
        servicio: cita.servicio,
        fecha: cita.fecha,
        hora: cita.hora,
        profesional: cita.profesional,
        confirmarUrl: confirmLink,
        reprogramarUrl: reprogramarLink,
        cancelarUrl: cancelLink,
      },
      qrData: cita.qr_code,
    });
  }

  /**
   * Notifica recordatorio de cita
   */
  static async notifyRecordatorio(
    userId: string,
    cita: { servicio: string; fecha: string; hora: string; profesional?: string },
    userEmail?: string
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    const email = userEmail || user?.email;
    
    if (!email) {
      console.error('No se encontró email para notificar');
      return false;
    }

    const message = `
Hola ${user?.name || 'Usuario'},

Le recordamos su cita:

📅 Servicio: ${cita.servicio}
📆 Fecha: ${cita.fecha}
🕐 Hora: ${cita.hora}

¡Nos vemos pronto!

Equipo ReservaFlow
    `.trim();

    return await this.send({
      to: email,
      subject: 'Recordatorio de cita - ReservaFlow',
      message,
      type: 'email',
      template: 'recordatorio',
      templateData: {
        nombre: user?.name || 'Usuario',
        servicio: cita.servicio,
        fecha: cita.fecha,
        hora: cita.hora,
        profesional: cita.profesional,
      },
    });
  }

  /**
   * Notifica turno obtenido
   */
  static async notifyTurnoObtenido(
    userId: string,
    turno: { numero: number; servicio: string; tiempoEstimado: number; qr_code?: string },
    userEmail?: string
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    const email = userEmail || user?.email;
    
    if (!email) {
      console.error('No se encontró email para notificar');
      return false;
    }

    const message = `
${user?.name || 'Usuario'}, tu turno #${turno.numero} está listo.

📋 Servicio: ${turno.servicio}
⏱️ Tiempo estimado: ${turno.tiempoEstimado} minutos

Presenta tu código QR en la recepción.

Equipo ReservaFlow
    `.trim();

    return await this.send({
      to: email,
      subject: `Turno #${turno.numero} - ReservaFlow`,
      message,
      type: 'email',
      template: 'turno_obtenido',
      templateData: {
        nombre: user?.name || 'Usuario',
        numero: turno.numero,
        servicio: turno.servicio,
        tiempoEstimado: turno.tiempoEstimado,
      },
      qrData: turno.qr_code,
    });
  }

  /**
   * Notifica que es el turno del usuario (cuando la recepcionista llama siguiente)
   */
  static async notifyTurnoListo(
    userId: string,
    turno: { numero: number; servicio: string; cola?: string },
    userEmail?: string
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    const email = userEmail || user?.email;
    
    if (!email) {
      console.error('No se encontró email para notificar');
      return false;
    }

    const message = `
🚨 ${user?.name || 'Usuario'}, ¡ES TU TURNO #${turno.numero}!

📋 Servicio: ${turno.servicio}
${turno.cola ? `📍 Cola: ${turno.cola}\n` : ''}

Por favor, acércate a la recepción inmediatamente.

Equipo ReservaFlow
    `.trim();

    return await this.send({
      to: email,
      subject: `🚨 Tu turno #${turno.numero} está listo - ReservaFlow`,
      message,
      type: 'email',
      template: 'turno_obtenido',
      templateData: {
        nombre: user?.name || 'Usuario',
        numero: turno.numero,
        servicio: turno.servicio,
        tiempoEstimado: 0,
      },
    });
  }

  /**
   * Notifica cuando faltan pocos turnos (según la cola)
   */
  static async notifyTurnosFaltantes(
    userId: string,
    turno: { numero: number; turnosAntes: number; servicio: string },
    userEmail?: string
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    const email = userEmail || user?.email;
    
    if (!email) {
      console.error('No se encontró email para notificar');
      return false;
    }

    const message = `
⏰ ${user?.name || 'Usuario'}, aviso importante:

Tu turno #${turno.numero} está próximo.

📋 Servicio: ${turno.servicio}
🎯 Turnos antes: ${turno.turnosAntes}
📍 Te recomendamos acercarte a la recepción en los próximos minutos.

Equipo ReservaFlow
    `.trim();

    return await this.send({
      to: email,
      subject: `⏰ Turno #${turno.numero} próximo - ReservaFlow`,
      message,
      type: 'email',
    });
  }

  /**
   * Notifica check-in de cita
   */
  static async notifyCheckInCita(
    userId: string,
    cita: { servicio: string; fecha: string; hora: string; profesional?: string },
    userEmail?: string
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    const email = userEmail || user?.email;
    
    if (!email) {
      console.error('No se encontró email para notificar');
      return false;
    }

    const message = `
✅ Check-in realizado

${user?.name || 'Usuario'}, has sido registrado en recepción.

📅 Servicio: ${cita.servicio}
👨‍⚕️ Doctor: ${cita.profesional}
🕐 Horario: ${cita.hora}

Por favor espera a ser llamado.

Equipo ReservaFlow
    `.trim();

    return await this.send({
      to: email,
      subject: 'Check-in confirmado - ReservaFlow',
      message,
      type: 'email',
    });
  }

  /**
   * Notifica creación de cuenta con link de verificación
   */
  static async notifyCuentaCreada(
    userId: string,
    credenciales: { nombre: string; email: string; password: string; tokenVerificacion?: string },
    userEmail?: string
  ): Promise<boolean> {
    const email = userEmail;
    
    if (!email) {
      console.error('No se encontró email para notificar');
      return false;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verifyLink = credenciales.tokenVerificacion 
      ? `${baseUrl}/verify-email?token=${credenciales.tokenVerificacion}`
      : `${baseUrl}/verify-email`;
    const loginLink = `${baseUrl}/login`;

    const message = `
¡Bienvenido/a a CitaVerde! 🎉

Tu cuenta ha sido creada exitosamente:

👤 Nombre: ${credenciales.nombre}
📧 Email: ${credenciales.email}
🔑 Contraseña: ${credenciales.password}

⚠️ IMPORTANTE: 
1. Guarda estas credenciales en un lugar seguro.
2. Debes verificar tu email antes de poder iniciar sesión.

🔗 VERIFICA TU EMAIL AHORA: ${verifyLink}

Después de verificar tu email, podrás iniciar sesión en: ${loginLink}

Si no has solicitado esta cuenta, puedes ignorar este mensaje.

Saludos,
Equipo CitaVerde - Gestión de Citas y Turnos
    `.trim();

    return await this.send({
      to: email,
      subject: 'Bienvenido a CitaVerde - Verifica tu email',
      message,
      type: 'email',
      template: 'verificacion_email',
      templateData: {
        nombre: credenciales.nombre,
        email: credenciales.email,
        verifyLink: verifyLink,
        loginLink: loginLink,
      },
    });
  }

  /**
   * Envía email de verificación
   */
  static async sendVerificationEmail(
    userId: string,
    data: { nombre: string; email: string; verifyLink: string },
    userEmail?: string
  ): Promise<boolean> {
    const email = userEmail || data.email;
    
    if (!email) {
      console.error('No se encontró email para notificar');
      return false;
    }

    const message = `
Hola ${data.nombre},

Por favor verifica tu dirección de email haciendo clic en el siguiente enlace:

🔗 VERIFICAR EMAIL: ${data.verifyLink}

Este enlace expirará en 7 días.

Si no solicitaste esta verificación, puedes ignorar este mensaje.

Saludos,
Equipo CitaVerde
    `.trim();

    return await this.send({
      to: email,
      subject: 'Verifica tu email - CitaVerde',
      message,
      type: 'email',
      template: 'verificacion_email',
      templateData: {
        nombre: data.nombre,
        email: data.email,
        verifyLink: data.verifyLink,
      },
    });
  }

  /**
   * Notifica encuesta de satisfacción al completar cita
   */
  static async notifyEncuestaCita(
    userId: string,
    cita: { servicio: string; profesional: string; fecha: string; hora: string; citaId: string },
    userEmail?: string
  ): Promise<boolean> {
    const user = mockUsers.find(u => u.id === userId);
    const email = userEmail || user?.email;
    
    if (!email) {
      console.error('No se encontró email para notificar');
      return false;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const encuestaLink = `${baseUrl}/usuario/mis-citas`;

    const message = `
¡Gracias por tu visita! ⭐

Estimado/a ${user?.name || 'Usuario'},

Tu cita ha sido completada exitosamente:

📋 Servicio: ${cita.servicio}
👨‍⚕️ Doctor: ${cita.profesional}
📅 Fecha: ${cita.fecha}
🕐 Hora: ${cita.hora}

Tu opinión es muy importante para nosotros. ¿Podrías compartir tu experiencia y calificar el servicio recibido?

🔗 ${encuestaLink}

¡Gracias por tu tiempo!

Equipo ReservaFlow
    `.trim();

    return await this.send({
      to: email,
      subject: '⭐ Cuéntanos tu experiencia - ReservaFlow',
      message,
      type: 'email',
    });
  }
}
