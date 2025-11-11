# Configuración de VAPID para Push Notifications

## ¿Qué es VAPID y por qué lo necesitas?

**VAPID** (Voluntary Application Server Identification) permite que tu servidor envíe notificaciones push incluso cuando la aplicación está completamente cerrada. Esto mejora significativamente el sistema porque:

### ✅ Ventajas de VAPID:

1. **Notificaciones cuando la app está cerrada**: El usuario recibirá notificaciones incluso si cerró completamente la aplicación
2. **Recordatorios programados**: Los cron jobs del servidor pueden enviar notificaciones automáticamente
3. **Más confiable**: Las notificaciones críticas (como "Es tu turno") siempre llegarán
4. **Experiencia similar a apps nativas**: Funciona como las notificaciones de apps móviles

### ⚠️ Sin VAPID (sistema actual):

- Solo funciona cuando la app está abierta o en segundo plano
- No funciona para recordatorios programados del servidor
- Depende de que el cliente esté activo

## Pasos para Configurar VAPID

### ✅ Configuración Automática (Recomendado)

**¡Solo ejecuta un comando!**

```bash
npm run setup:vapid
```

Este comando:
- ✅ Genera las claves VAPID automáticamente
- ✅ Las agrega a `.env.local` automáticamente
- ✅ Configura todo sin intervención manual

**¡Listo!** Ya está configurado. Solo reinicia el servidor.

### 🔧 Configuración Manual (Opcional)

Si prefieres hacerlo manualmente:

#### 1. Generar Claves VAPID

```bash
npm run generate:vapid
```

O usando web-push directamente:
```bash
npm install -g web-push
web-push generate-vapid-keys
```

#### 2. Agregar Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# VAPID Keys para Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKx...tu_clave_publica...
VAPID_PRIVATE_KEY=tu_clave_privada_secreta...
VAPID_EMAIL=mailto:admin@citaverde.com
```

**⚠️ IMPORTANTE:**
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` debe empezar con `NEXT_PUBLIC_` porque se usa en el cliente
- `VAPID_PRIVATE_KEY` es secreta, NUNCA la expongas en el cliente
- `VAPID_EMAIL` es un email de contacto (puede ser cualquiera)

### 3. Crear Tabla en Supabase

Ejecuta el script SQL para crear la tabla de suscripciones:

```bash
# En Supabase SQL Editor, ejecuta:
```

O ejecuta el archivo `scripts/create-push-subscriptions-table.sql`

### 3. Instalar Dependencia (si no está instalada)

El script `setup:vapid` instala `web-push` automáticamente si no está instalado.

Si necesitas instalarlo manualmente:
```bash
npm install web-push
```

### 4. Reiniciar el Servidor

```bash
npm run dev
```

## Cómo Funciona

1. **Usuario abre la app**: Se solicita permiso para notificaciones
2. **Se crea suscripción**: El navegador genera una suscripción única
3. **Se guarda en servidor**: La suscripción se guarda en la base de datos
4. **Servidor envía notificaciones**: Cuando hay un evento, el servidor envía la notificación usando la suscripción guardada

## Uso en el Código

El sistema ya está preparado. Una vez configurado VAPID:

- Las notificaciones locales seguirán funcionando
- Las notificaciones desde servidor también funcionarán
- Los recordatorios programados podrán enviar notificaciones

## Verificar que Funciona

1. Abre la aplicación en el navegador
2. Acepta los permisos de notificación
3. Cierra completamente la aplicación
4. Desde el servidor (o usando la API), envía una notificación de prueba
5. Deberías recibir la notificación incluso con la app cerrada

## Troubleshooting

### Error: "VAPID keys no configuradas"
- Verifica que las variables estén en `.env.local`
- Reinicia el servidor después de agregar las variables

### Error: "Usuario no tiene suscripción push activa"
- El usuario debe haber aceptado los permisos de notificación
- La suscripción se guarda automáticamente cuando se inicializa

### Las notificaciones no llegan
- Verifica que el usuario haya aceptado los permisos
- Revisa la consola del navegador para errores
- Verifica que la tabla `push_subscriptions` exista en Supabase

## Notas de Seguridad

- ⚠️ **NUNCA** expongas `VAPID_PRIVATE_KEY` en el cliente
- ✅ Solo `NEXT_PUBLIC_VAPID_PUBLIC_KEY` debe estar en el cliente
- ✅ La clave privada solo se usa en el servidor

## ¿Es Necesario?

**Para desarrollo/testing**: No es estrictamente necesario, las notificaciones locales funcionan bien.

**Para producción**: **SÍ, altamente recomendado** porque:
- Mejor experiencia de usuario
- Notificaciones más confiables
- Funciona para recordatorios programados
- Experiencia similar a apps nativas

