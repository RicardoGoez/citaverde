/**
 * Templates de email profesionales
 */

interface EmailTemplateData {
  title: string;
  content: string;
  qrCode?: string;
  qrTitle?: string;
  actions?: Array<{
    label: string;
    url: string;
    primary?: boolean;
  }>;
  footer?: string;
}

/**
 * Genera un template HTML de email moderno y responsivo
 */
export function generateEmailTemplate(data: EmailTemplateData): string {
  const { title, content, qrCode, qrTitle = "Tu Código QR", actions = [], footer } = data;

  // Generar botones de acción
  const actionButtons = actions.map((action, index) => {
    const isPrimary = action.primary !== false;
    const buttonStyle = isPrimary
      ? "background: #16A34A; color: white;"
      : "background: white; color: #16A34A; border: 2px solid #16A34A;";
    
    return `
      <a href="${action.url}" style="
        ${buttonStyle}
        display: inline-block;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
        margin: ${index > 0 ? '10px 5px 0' : '0 5px 0 0'};
        transition: all 0.3s;
      ">${action.label}</a>
    `;
  }).join('');

  // Generar sección QR
  const qrSection = qrCode ? `
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; border: 1px solid #16A34A;">
      <h3 style="color: #16A34A; margin: 0 0 15px 0; font-size: 20px; font-weight: bold;">${qrTitle}</h3>
      <div style="background: white; padding: 15px; display: inline-block; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <img src="${qrCode}" alt="Código QR" style="max-width: 200px; height: auto; display: block;" />
      </div>
      <p style="color: #059669; margin: 15px 0 0 0; font-size: 14px; font-weight: 500;">
        📱 Presenta este código al llegar a la sede
      </p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #16A34A 0%, #15803D 100%); padding: 30px 20px; text-align: center;">
              <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 5px;">🏥 ReservaFlow</div>
              <div style="color: rgba(255,255,255,0.9); font-size: 14px;">Sistema de Gestión de Citas</div>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #111827; font-size: 24px; font-weight: bold; margin: 0 0 20px 0;">${title}</h1>
              
              ${qrSection}
              
              <div style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                ${content.replace(/\n/g, '<br>')}
              </div>

              ${actions.length > 0 ? `
              <div style="margin: 30px 0; text-align: center;">
                ${actionButtons}
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
              ${footer ? `
              <div style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 10px;">
                ${footer}
              </div>
              ` : ''}
              <div style="color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">
                <p style="margin: 5px 0;">Este es un email automático, por favor no responder.</p>
                <p style="margin: 5px 0;">© ${new Date().getFullYear()} ReservaFlow. Todos los derechos reservados.</p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Template para confirmación de cita
 */
export function getCitaConfirmadaTemplate(data: {
  nombre: string;
  servicio: string;
  fecha: string;
  hora: string;
  profesional: string;
  sede?: string;
  direccion?: string;
  qrCode?: string;
  confirmarUrl?: string;
  cancelarUrl?: string;
  reprogramarUrl?: string;
}): string {
  const actions = [];
  
  if (data.confirmarUrl) {
    actions.push({
      label: "✅ Confirmar Cita",
      url: data.confirmarUrl,
      primary: true,
    });
  }
  
  if (data.cancelarUrl) {
    actions.push({
      label: "❌ Cancelar Cita",
      url: data.cancelarUrl,
      primary: false,
    });
  }

  if (data.reprogramarUrl) {
    actions.push({
      label: "🔄 Reprogramar Cita",
      url: data.reprogramarUrl,
      primary: false,
    });
  }

  const content = `
    <div style="margin-bottom: 20px;">
      <p style="margin: 10px 0; font-size: 16px; color: #111827;">Hola <strong>${data.nombre}</strong>,</p>
      <p style="margin: 10px 0; font-size: 16px; color: #111827;">Tu cita ha sido confirmada exitosamente:</p>
    </div>

    <div style="background: #f9fafb; border-left: 4px solid #16A34A; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <span style="font-size: 20px; margin-right: 10px;">📅</span>
        <div>
          <strong style="color: #374151; font-size: 14px; text-transform: uppercase;">Servicio</strong>
          <p style="margin: 4px 0 0 0; color: #111827; font-size: 16px;">${data.servicio}</p>
        </div>
      </div>

      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <span style="font-size: 20px; margin-right: 10px;">🕐</span>
        <div>
          <strong style="color: #374151; font-size: 14px; text-transform: uppercase;">Fecha y Hora</strong>
          <p style="margin: 4px 0 0 0; color: #111827; font-size: 16px;">${data.fecha} a las ${data.hora}</p>
        </div>
      </div>

      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <span style="font-size: 20px; margin-right: 10px;">👨‍⚕️</span>
        <div>
          <strong style="color: #374151; font-size: 14px; text-transform: uppercase;">Profesional</strong>
          <p style="margin: 4px 0 0 0; color: #111827; font-size: 16px;">${data.profesional}</p>
        </div>
      </div>

      ${data.sede ? `
      <div style="display: flex; align-items: start;">
        <span style="font-size: 20px; margin-right: 10px;">📍</span>
        <div>
          <strong style="color: #374151; font-size: 14px; text-transform: uppercase;">Sede</strong>
          <p style="margin: 4px 0 0 0; color: #111827; font-size: 16px;">${data.sede}</p>
          ${data.direccion ? `<p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${data.direccion}</p>` : ''}
        </div>
      </div>
      ` : ''}
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
        💡 <strong>Recordatorio importante:</strong> 
        Presenta tu código QR al llegar. El check-in automático está disponible hasta 15 minutos antes de tu cita.
      </p>
    </div>
  `;

  return generateEmailTemplate({
    title: "Cita Confirmada",
    content,
    qrCode: data.qrCode,
    qrTitle: "Tu Código QR de Check-in",
    actions,
    footer: "¿Necesitas reprogramar tu cita? Visita tu panel de usuario en la app."
  });
}

/**
 * Template para recordatorio
 */
export function getRecordatorioTemplate(data: {
  nombre: string;
  servicio: string;
  fecha: string;
  hora: string;
  profesional?: string;
}): string {
  const content = `
    <p style="margin: 10px 0; font-size: 16px; color: #111827;">Hola <strong>${data.nombre}</strong>,</p>
    <p style="margin: 10px 0; font-size: 16px; color: #111827;">Te recordamos que tienes una cita programada:</p>

    <div style="background: #f9fafb; border-left: 4px solid #16A34A; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 5px 0; color: #111827; font-size: 16px;"><strong>${data.servicio}</strong></p>
      <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">📅 ${data.fecha} a las 🕐 ${data.hora}</p>
      ${data.profesional ? `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;">👨‍⚕️ ${data.profesional}</p>` : ''}
    </div>

    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 500;">
        ⏰ <strong>No olvides:</strong> Presenta tu código QR al llegar para el check-in automático.
      </p>
    </div>

    <p style="margin: 20px 0 10px 0; font-size: 16px; color: #111827;">¡Nos vemos pronto!</p>
    <p style="margin: 0; font-size: 14px; color: #6b7280;">Si necesitas reprogramar o cancelar, puedes hacerlo desde la app.</p>
  `;

  return generateEmailTemplate({
    title: "Recordatorio de Cita",
    content,
    footer: "Para gestionar tus citas, visita tu panel de usuario en ReservaFlow."
  });
}

/**
 * Template para turno obtenido
 */
export function getTurnoObtenidoTemplate(data: {
  nombre: string;
  numero: number;
  servicio: string;
  tiempoEstimado: number;
  qrCode?: string;
}): string {
  const content = `
    <p style="margin: 10px 0; font-size: 16px; color: #111827;">Hola <strong>${data.nombre}</strong>,</p>
    <p style="margin: 10px 0; font-size: 16px; color: #111827;">Tu turno ha sido registrado:</p>

    <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border: 2px solid #2563eb; padding: 25px; margin: 20px 0; border-radius: 12px; text-align: center;">
      <div style="font-size: 48px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">#${data.numero}</div>
      <p style="margin: 0; color: #1e40af; font-size: 16px; font-weight: 600;">Turno Registrado</p>
    </div>

    <div style="background: #f9fafb; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <span style="font-size: 20px; margin-right: 10px;">📋</span>
        <div>
          <strong style="color: #374151; font-size: 14px; text-transform: uppercase;">Servicio</strong>
          <p style="margin: 4px 0 0 0; color: #111827; font-size: 16px;">${data.servicio}</p>
        </div>
      </div>

      <div style="display: flex; align-items: start;">
        <span style="font-size: 20px; margin-right: 10px;">⏱️</span>
        <div>
          <strong style="color: #374151; font-size: 14px; text-transform: uppercase;">Tiempo Estimado</strong>
          <p style="margin: 4px 0 0 0; color: #111827; font-size: 16px;">Aproximadamente ${data.tiempoEstimado} minutos</p>
        </div>
      </div>
    </div>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 8px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        📍 <strong>Consulta tu posición en tiempo real</strong> desde la app. Presenta tu código QR cuando sea tu turno.
      </p>
    </div>
  `;

  return generateEmailTemplate({
    title: `Turno #${data.numero}`,
    content,
    qrCode: data.qrCode,
    qrTitle: "Código QR del Turno",
    footer: "Monitorea tu turno en tiempo real desde tu panel de usuario."
  });
}

