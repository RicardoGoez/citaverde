import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateQRCode } from "@/lib/utils/qr";
import {
  getCitaConfirmadaTemplate,
  getRecordatorioTemplate,
  getTurnoObtenidoTemplate
} from "@/lib/templates/email-template";

// Configuración del transporter para desarrollo y producción
async function createTransporter() {
  // Si hay configuración de email real, usarla
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

    // Obtener transporter
    const transporter = await createTransporter();
    
    // Generar HTML según template o mensaje simple
    let htmlContent: string;
    
    if (template && templateData) {
      // Usar templates avanzados
      let qrDataUrl: string | undefined;
      
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
        default:
          htmlContent = message.replace(/\n/g, "<br>");
      }
    } else {
      // Modo simple con QR opcional
      htmlContent = message.replace(/\n/g, "<br>");
      
      if (includeQR && qrData) {
        try {
          const qrImageDataUrl = await generateQRCode(qrData);
          const qrHtml = `
            <div style="text-align: center; margin: 20px 0;">
              <h3 style="color: #333; margin-bottom: 10px;">Tu Código QR</h3>
              <img src="${qrImageDataUrl}" alt="Código QR" style="max-width: 200px; border: 2px solid #16A34A; padding: 10px; background: white;" />
              <p style="color: #666; font-size: 12px; margin-top: 10px;">Presenta este código al llegar a la sede</p>
            </div>
          `;
          htmlContent = `${qrHtml}<hr style="border: 1px solid #eee; margin: 20px 0;">${htmlContent}`;
        } catch (qrError) {
          console.error("Error generando QR para email:", qrError);
        }
      }
    }

    // Preparar email
    const mailOptions = {
      from: process.env.EMAIL_FROM || "ReservaFlow <noreply@reservaflow.com>",
      to,
      subject,
      text: message,
      html: htmlContent,
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);

    // Log para desarrollo
    if (process.env.NODE_ENV === "development") {
      console.log("📧 Email enviado:");
      console.log("   A:", to);
      console.log("   Asunto:", subject);
      console.log("   Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Email enviado exitosamente",
        previewUrl: nodemailer.getTestMessageUrl(info) // Solo disponible en desarrollo/testing
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error enviando email:", error);
    return NextResponse.json(
      { success: false, message: "Error al enviar el email" },
      { status: 500 }
    );
  }
}

