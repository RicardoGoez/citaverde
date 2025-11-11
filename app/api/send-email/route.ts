import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { generateQRCode } from "@/lib/utils/qr";
import {
  getCitaConfirmadaTemplate,
  getRecordatorioTemplate,
  getTurnoObtenidoTemplate,
  getVerificacionEmailTemplate
} from "@/lib/templates/email-template";

// Inicializar Resend si hay API key
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Configuración del transporter SMTP para desarrollo y producción
async function createTransporter() {
  // Si hay configuración de email SMTP real, usarla
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_PORT === "465", // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  
  // Para desarrollo: generar cuenta de prueba con Ethereal
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message, type, includeQR, qrData, template, templateData } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { success: false, message: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    // Generar HTML según template o mensaje simple
    let htmlContent: string;
    let qrDataUrl: string | undefined;
    
    if (template && templateData) {
      // Usar templates avanzados
      // Generar QR si es necesario
      if (qrData) {
        try {
          qrDataUrl = await generateQRCode(qrData);
        } catch (qrError) {
          console.error("Error generando QR para email:", qrError);
        }
      }
      
      // Generar template según tipo
      switch (template) {
        case 'cita_confirmada':
          htmlContent = getCitaConfirmadaTemplate({
            ...templateData,
            qrCode: qrDataUrl,
          });
          break;
        case 'recordatorio':
          htmlContent = getRecordatorioTemplate(templateData);
          break;
        case 'turno_obtenido':
          htmlContent = getTurnoObtenidoTemplate({
            ...templateData,
            qrCode: qrDataUrl,
          });
          break;
        case 'verificacion_email':
          htmlContent = getVerificacionEmailTemplate(templateData);
          break;
        default:
          htmlContent = message.replace(/\n/g, "<br>");
      }
    } else {
      // Modo simple con QR opcional
      htmlContent = message.replace(/\n/g, "<br>");
      
      if (includeQR && qrData) {
        try {
          qrDataUrl = await generateQRCode(qrData);
          const qrHtml = `
            <div style="text-align: center; margin: 20px 0;">
              <h3 style="color: #333; margin-bottom: 10px;">Tu Código QR</h3>
              <img src="${qrDataUrl}" alt="Código QR" style="max-width: 200px; border: 2px solid #16A34A; padding: 10px; background: white;" />
              <p style="color: #666; font-size: 12px; margin-top: 10px;">Presenta este código al llegar a la sede</p>
            </div>
          `;
          htmlContent = `${qrHtml}<hr style="border: 1px solid #eee; margin: 20px 0;">${htmlContent}`;
        } catch (qrError) {
          console.error("Error generando QR para email:", qrError);
        }
      }
    }

    // Intentar enviar con Resend primero (más confiable)
    if (resend) {
      try {
        const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
        
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [to],
          subject: subject,
          html: htmlContent,
          text: message,
        });

        if (error) {
          console.error("Error enviando con Resend:", error);
          throw error;
        }

        console.log("✅ Email enviado exitosamente con Resend");
        console.log("   A:", to);
        console.log("   Asunto:", subject);
        console.log("   ID:", data?.id);

        return NextResponse.json(
          { 
            success: true, 
            message: "Email enviado exitosamente",
            method: "resend",
            emailId: data?.id
          },
          { status: 200 }
        );
      } catch (resendError) {
        console.error("Error con Resend, intentando SMTP:", resendError);
        // Continuar con SMTP como fallback
      }
    }

    // Fallback a SMTP si Resend no está disponible o falló
    try {
      const transporter = await createTransporter();
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || "ReservaFlow <noreply@reservaflow.com>",
        to,
        subject,
        text: message,
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);

      // Log para desarrollo
      if (process.env.NODE_ENV === "development") {
        console.log("📧 Email enviado con SMTP:");
        console.log("   A:", to);
        console.log("   Asunto:", subject);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log("   Preview URL:", previewUrl);
        }
      }

      return NextResponse.json(
        { 
          success: true, 
          message: "Email enviado exitosamente",
          method: "smtp",
          previewUrl: nodemailer.getTestMessageUrl(info) // Solo disponible en desarrollo/testing
        },
        { status: 200 }
      );
    } catch (smtpError) {
      console.error("Error enviando con SMTP:", smtpError);
      throw smtpError;
    }
  } catch (error: any) {
    console.error("Error enviando email:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Error al enviar el email. Verifica la configuración de email en las variables de entorno.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

