# Configuración de Envío de Emails

Para que el sistema envíe emails reales cuando se crean citas, necesitas configurar un servicio de email.

## Opción 1: Resend (Recomendado - Más Fácil) ⭐

Resend es un servicio moderno y fácil de usar para enviar emails.

### Pasos:

1. **Crear cuenta en Resend**
   - Ve a https://resend.com
   - Crea una cuenta gratuita
   - Obtén tu API Key desde https://resend.com/api-keys

2. **Configurar dominio (Opcional pero recomendado)**
   - En Resend, ve a "Domains"
   - Agrega tu dominio y sigue las instrucciones para verificar
   - Esto te permite usar emails como `noreply@tudominio.com`

3. **Agregar variables de entorno**
   - Crea un archivo `.env.local` en la raíz del proyecto
   - Agrega:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@tudominio.com
   ```
   - Si no tienes dominio verificado, usa: `onboarding@resend.dev`

4. **Reiniciar el servidor**
   ```bash
   npm run dev
   ```

## Opción 2: SMTP (Gmail, Outlook, etc.)

### Para Gmail:

1. **Habilitar verificación en 2 pasos**
   - Ve a https://myaccount.google.com/security
   - Activa "Verificación en 2 pasos"

2. **Crear contraseña de aplicación**
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Ingresa "Citaverde" como nombre
   - Copia la contraseña generada (16 caracteres)

3. **Agregar variables de entorno**
   - Crea un archivo `.env.local` en la raíz del proyecto
   - Agrega:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASS=tu-contraseña-de-aplicacion-16-caracteres
   EMAIL_FROM=Citaverde <tu-email@gmail.com>
   ```

4. **Reiniciar el servidor**
   ```bash
   npm run dev
   ```

### Para Outlook/Office 365:

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=tu-email@outlook.com
EMAIL_PASS=tu-contraseña
EMAIL_FROM=Citaverde <tu-email@outlook.com>
```

### Para otros proveedores SMTP:

Consulta la documentación de tu proveedor para obtener:
- Host SMTP
- Puerto (generalmente 587 para TLS o 465 para SSL)
- Usuario y contraseña

## Verificar que funciona

1. Crea una cita desde la interfaz de usuario
2. Revisa la consola del servidor - deberías ver:
   ```
   ✅ Email enviado exitosamente con Resend
   ```
   o
   ```
   📧 Email enviado con SMTP
   ```
3. Revisa la bandeja de entrada del email del usuario

## Notas Importantes

- **En desarrollo**: Si no configuras nada, el sistema usará Ethereal Email (solo para pruebas, no envía emails reales)
- **En producción**: Debes configurar Resend o SMTP para que funcione
- **Límites**: 
  - Resend: 3,000 emails/mes gratis
  - Gmail: 500 emails/día
- **Seguridad**: Nunca subas el archivo `.env.local` a Git

## Solución de Problemas

### Error: "No se encontró email para notificar"
- Verifica que el usuario tenga un email registrado en la base de datos

### Error: "Error al enviar el email"
- Verifica que las variables de entorno estén correctamente configuradas
- Revisa la consola del servidor para más detalles
- Si usas Gmail, asegúrate de usar una "Contraseña de aplicación", no tu contraseña normal

### Los emails no llegan
- Revisa la carpeta de spam
- Verifica que el email del destinatario sea válido
- Revisa los logs del servidor para ver si hay errores

