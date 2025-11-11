#!/usr/bin/env node

/**
 * Script completo para configurar VAPID automáticamente
 * Incluye generación de claves y verificación
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

console.log('🚀 Configurando VAPID para Push Notifications...\n');

// Verificar si web-push está instalado
try {
  require.resolve('web-push');
} catch (e) {
  console.log('📦 Instalando web-push...');
  execSync('npm install web-push', { stdio: 'inherit' });
}

// Generar claves
const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ Claves VAPID generadas\n');

// Configurar .env.local
const envPath = path.join(process.cwd(), '.env.local');
let envContent = fs.existsSync(envPath) 
  ? fs.readFileSync(envPath, 'utf8') 
  : '';

function setEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  }
  return content + (content && !content.endsWith('\n') ? '\n' : '') + `${key}=${value}\n`;
}

envContent = setEnvVar(envContent, 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', vapidKeys.publicKey);
envContent = setEnvVar(envContent, 'VAPID_PRIVATE_KEY', vapidKeys.privateKey);
envContent = setEnvVar(envContent, 'VAPID_EMAIL', 'mailto:admin@citaverde.com');

fs.writeFileSync(envPath, envContent, 'utf8');

console.log('✅ Configuración guardada en .env.local\n');
console.log('📋 Claves generadas:');
console.log(`   Public Key: ${vapidKeys.publicKey.substring(0, 20)}...`);
console.log(`   Private Key: ${vapidKeys.privateKey.substring(0, 20)}...`);
console.log('');
console.log('🎉 ¡VAPID configurado exitosamente!');
console.log('');
console.log('📝 Próximos pasos:');
console.log('   1. Reinicia el servidor: npm run dev');
console.log('   2. Las notificaciones push desde servidor ya están activas');
console.log('');

