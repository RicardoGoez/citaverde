#!/usr/bin/env node

/**
 * Script para generar claves VAPID automáticamente
 * Ejecutar: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

console.log('🔑 Generando claves VAPID...\n');

// Generar claves VAPID
const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ Claves VAPID generadas exitosamente!\n');
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
console.log('');

// Leer .env.local si existe
const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📝 Archivo .env.local encontrado, actualizando...\n');
} else {
  console.log('📝 Creando archivo .env.local...\n');
}

// Función para actualizar o agregar variable de entorno
function updateEnvVar(content, key, value) {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    // Actualizar variable existente
    return content.replace(regex, `${key}=${value}`);
  } else {
    // Agregar nueva variable
    return content + (content.endsWith('\n') ? '' : '\n') + `${key}=${value}\n`;
  }
}

// Actualizar o agregar claves VAPID
envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_VAPID_PUBLIC_KEY', vapidKeys.publicKey);
envContent = updateEnvVar(envContent, 'VAPID_PRIVATE_KEY', vapidKeys.privateKey);

// Agregar VAPID_EMAIL si no existe
if (!envContent.includes('VAPID_EMAIL=')) {
  envContent = updateEnvVar(envContent, 'VAPID_EMAIL', 'mailto:admin@citaverde.com');
}

// Escribir archivo .env.local
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('✅ Variables agregadas a .env.local:');
console.log('   - NEXT_PUBLIC_VAPID_PUBLIC_KEY');
console.log('   - VAPID_PRIVATE_KEY');
console.log('   - VAPID_EMAIL');
console.log('');
console.log('🎉 ¡Configuración completada!');
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('   1. Reinicia el servidor de desarrollo (npm run dev)');
console.log('   2. Las claves ya están configuradas y listas para usar');
console.log('   3. No compartas VAPID_PRIVATE_KEY públicamente');
console.log('');

