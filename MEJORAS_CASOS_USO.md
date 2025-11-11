# Mejoras de Casos de Uso Implementadas

Este documento describe las mejoras implementadas para cubrir casos de uso faltantes en el sistema de gestión de citas.

## 1. Límites de Tiempo para Cancelar/Reprogramar ✅

### Implementación
- **Archivo**: `lib/utils/cita-validations.ts`
- **Configuración**: 
  - Mínimo 2 horas antes de la cita para cancelar
  - Mínimo 2 horas antes de la cita para reprogramar
  - Configurable en `CITA_CONFIG`

### Funcionalidad
- Valida que haya suficiente tiempo antes de permitir cancelar o reprogramar
- Muestra mensajes de error claros cuando no se cumple el tiempo mínimo
- Los administradores y recepcionistas pueden omitir esta validación

### Archivos Modificados
- `app/usuario/mis-citas/page.tsx` - Validación al cancelar
- `app/usuario/reprogramar-cita/page.tsx` - Validación al reprogramar
- `app/api/citas/[id]/cancelar/route.ts` - Validación en API
- `app/api/citas/[id]/route.ts` - Validación en DELETE endpoint

## 2. Notificaciones al Cancelar ✅

### Implementación
- **Archivo**: `lib/services/notifications.ts`
- **Nuevas funciones**:
  - `notifyProfesionalCitaCancelada()` - Notifica al profesional
  - `notifyListaEsperaSlotDisponible()` - Notifica a usuarios en lista de espera

### Funcionalidad
- Cuando se cancela una cita:
  - Se envía email al profesional informando la cancelación
  - Se envía notificación push al profesional
  - Se prepara el sistema para notificar a usuarios en lista de espera (cuando se implemente)

### Archivos Modificados
- `lib/services/cita-cancelation.ts` - Servicio centralizado de cancelación
- `app/usuario/mis-citas/page.tsx` - Usa nuevo servicio
- `app/recepcionista/citas/page.tsx` - Usa nuevo servicio
- `app/api/citas/[id]/route.ts` - Usa nuevo servicio

## 3. Límites de Citas por Usuario ✅

### Implementación
- **Archivo**: `lib/utils/cita-validations.ts`
- **Configuración**: Máximo 3 citas activas simultáneas por usuario
- **Validación**: Se ejecuta automáticamente al crear una nueva cita

### Funcionalidad
- Valida que el usuario no exceda el límite de citas activas antes de crear una nueva
- Considera solo citas con estado "confirmada" y fecha/hora futura
- Muestra mensaje de error claro cuando se alcanza el límite

### Archivos Modificados
- `lib/actions/database.ts` - Validación en `createCita()`

## 4. Manejo de Citas Pasadas ✅

### Implementación
- **Archivo**: `lib/services/cita-cleanup.ts`
- **API Endpoint**: `app/api/cron/process-past-appointments/route.ts`

### Funcionalidad
- Procesa citas pasadas automáticamente
- Si una cita pasó hace más de 1 hora y no tiene check-in:
  - La marca como `no_show`
- Si una cita pasó pero tiene check-in:
  - La marca como `completada`

### Configuración del Cron Job

#### Opción 1: Vercel Cron
Agregar a `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-past-appointments",
    "schedule": "0 * * * *"
  }]
}
```

#### Opción 2: GitHub Actions
Crear `.github/workflows/process-appointments.yml`:
```yaml
name: Process Past Appointments
on:
  schedule:
    - cron: '0 * * * *'  # Cada hora
  workflow_dispatch:

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X GET "${{ secrets.API_URL }}/api/cron/process-past-appointments" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Opción 3: Manual
Llamar manualmente:
```bash
curl -X GET "https://tu-dominio.com/api/cron/process-past-appointments" \
  -H "Authorization: Bearer TU_CRON_SECRET"
```

### Variables de Entorno
Agregar a `.env.local`:
```env
CRON_SECRET=tu_secreto_seguro_aqui
```

## Archivos Creados

1. `lib/utils/cita-validations.ts` - Utilidades de validación
2. `lib/services/cita-cancelation.ts` - Servicio de cancelación centralizado
3. `lib/services/cita-cleanup.ts` - Servicio de limpieza de citas pasadas
4. `app/api/cron/process-past-appointments/route.ts` - Endpoint para cron job

## Configuración

### Ajustar Límites
Editar `lib/utils/cita-validations.ts`:
```typescript
export const CITA_CONFIG = {
  MIN_HORAS_PARA_CANCELAR: 2,        // Cambiar según necesidad
  MIN_HORAS_PARA_REPROGRAMAR: 2,     // Cambiar según necesidad
  MAX_CITAS_ACTIVAS_POR_USUARIO: 3, // Cambiar según necesidad
};
```

## Próximos Pasos (Opcional)

1. **Lista de Espera**: Implementar tabla de usuarios en lista de espera y notificarlos cuando se libera un slot
2. **Notificaciones Push Mejoradas**: Agregar más detalles en las notificaciones push
3. **Reportes de No-Show**: Crear dashboard para analizar tasas de no-show
4. **Configuración Dinámica**: Mover `CITA_CONFIG` a base de datos para configuración en tiempo real

## Notas

- Las validaciones de tiempo se pueden omitir para administradores y recepcionistas
- El job de limpieza se puede ejecutar manualmente o automáticamente mediante cron
- Las notificaciones al profesional requieren que el profesional tenga email configurado

