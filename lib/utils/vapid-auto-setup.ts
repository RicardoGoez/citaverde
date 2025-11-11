/**
 * Utilidad para verificar y generar claves VAPID automáticamente si no existen
 * Se ejecuta solo en desarrollo
 */

export function checkVAPIDSetup(): {
  hasPublicKey: boolean;
  hasPrivateKey: boolean;
  isConfigured: boolean;
} {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  return {
    hasPublicKey: !!publicKey,
    hasPrivateKey: !!privateKey,
    isConfigured: !!publicKey && !!privateKey,
  };
}

/**
 * Mensaje de ayuda para configurar VAPID
 */
export function getVAPIDSetupMessage(): string {
  const setup = checkVAPIDSetup();
  
  if (setup.isConfigured) {
    return '✅ VAPID está configurado correctamente';
  }

  return `
⚠️  VAPID no está configurado

Para habilitar notificaciones push desde servidor:

1. Ejecuta: npm run setup:vapid
   O manualmente: npm run generate:vapid

2. Reinicia el servidor: npm run dev

Nota: Las notificaciones locales funcionan sin VAPID,
pero las notificaciones desde servidor requieren VAPID.
  `.trim();
}

