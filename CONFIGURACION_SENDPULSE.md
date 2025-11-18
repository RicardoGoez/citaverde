# Configuración de SendPulse para Envío de Correos

Este proyecto utiliza **SendPulse** como método principal para enviar correos electrónicos, con Resend y SMTP como métodos de respaldo.

## 📋 Requisitos Previos

1. **Cuenta en SendPulse**
   - Ve a https://login.sendpulse.com/emailservice/
   - Crea una cuenta o inicia sesión

2. **Obtener Credenciales de API**
   - Inicia sesión en tu cuenta de SendPulse
   - Navega a **"Configuración de la cuenta"** → **"API"**
   - Copia tu **"ID"** (API User ID) y **"Secret"** (API Secret)

## 🔧 Configuración

### Variables de Entorno

Agrega las siguientes variables a tu archivo `.env.local`:

```env
# SendPulse (Método Principal)
SENDPULSE_API_USER_ID=tu_api_user_id_aqui
SENDPULSE_API_SECRET=tu_api_secret_aqui
SENDPULSE_FROM_EMAIL=noreply@tudominio.com
EMAIL_FROM_NAME=Citaverde

# Email genérico (usado si no hay SENDPULSE_FROM_EMAIL)
EMAIL_FROM=noreply@citaverde.com

# Resend (Fallback - Opcional)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@tudominio.com

# SMTP (Fallback - Opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicación
```

### Pasos de Configuración

1. **Obtener credenciales de SendPulse:**
   ```
   1. Inicia sesión en https://login.sendpulse.com/emailservice/
   2. Ve a "Configuración de la cuenta" → "API"
   3. Copia tu "ID" y "Secret"
   ```

2. **Configurar email remitente:**
   - En SendPulse, verifica tu dominio o usa el email proporcionado por SendPulse
   - Agrega el email remitente en `SENDPULSE_FROM_EMAIL`

3. **Agregar variables al `.env.local`:**
   ```env
   SENDPULSE_API_USER_ID=tu_id_aqui
   SENDPULSE_API_SECRET=tu_secret_aqui
   SENDPULSE_FROM_EMAIL=noreply@tudominio.com
   EMAIL_FROM_NAME=Citaverde
   ```

## 🚀 Orden de Prioridad

El sistema intentará enviar correos en el siguiente orden:

1. **SendPulse** (si está configurado) ⭐ **Principal**
2. **Resend** (si SendPulse falla o no está configurado)
3. **SMTP** (si Resend falla o no está configurado)
4. **Ethereal Email** (solo en desarrollo, para pruebas)

## 📧 Verificación de Envío

Después de configurar SendPulse, puedes verificar que funciona:

1. **En la consola del servidor:**
   ```
   ✅ SendPulse inicializado correctamente
   ✅ Email enviado exitosamente con SendPulse
      A: destinatario@email.com
      Asunto: Confirmación de Cita
   ```

2. **En la respuesta de la API:**
   ```json
   {
     "success": true,
     "message": "Email enviado exitosamente",
     "method": "sendpulse",
     "emailId": "123456"
   }
   ```

3. **En el panel de SendPulse:**
   - Ve a "Estadísticas" → "Emails enviados"
   - Verás los correos enviados con su estado

## 🔍 Solución de Problemas

### Error: "SendPulse no está configurado"
- Verifica que `SENDPULSE_API_USER_ID` y `SENDPULSE_API_SECRET` estén en `.env.local`
- Reinicia el servidor después de agregar las variables

### Error: "Error desconocido de SendPulse"
- Verifica que las credenciales sean correctas
- Asegúrate de que el email remitente esté verificado en SendPulse
- Revisa los logs en el panel de SendPulse

### Los correos no se envían
- Verifica que el dominio esté verificado en SendPulse
- Revisa que no hayas excedido el límite de envíos de tu plan
- El sistema automáticamente intentará con Resend o SMTP como fallback

## 📚 Recursos Adicionales

- [Documentación de SendPulse API](https://sendpulse.com/integrations/api/api-email-en)
- [Panel de SendPulse](https://login.sendpulse.com/emailservice/)
- [Guía de verificación de dominio](https://sendpulse.com/support/glossary/domain-verification)

## 💡 Notas Importantes

- **SendPulse es el método principal**, pero el sistema tiene fallbacks automáticos
- Los tokens de autenticación se almacenan temporalmente en el sistema
- El sistema soporta HTML y texto plano en los correos
- Los códigos QR se generan automáticamente cuando se requieren

