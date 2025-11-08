/**
 * Genera icon-192.png e icon-512.png a partir de public/icon.svg
 * Requiere: sharp (ya está en dependencies)
 * Uso: npx ts-node scripts/generar-iconos.ts
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';

async function main() {
  const root = process.cwd();
  const svgPath = path.join(root, 'public', 'icon.svg');
  const png192Path = path.join(root, 'public', 'icon-192.png');
  const png512Path = path.join(root, 'public', 'icon-512.png');

  const svg = await fs.readFile(svgPath);

  await sharp(svg).resize(192, 192).png({ compressionLevel: 9 }).toFile(png192Path);
  await sharp(svg).resize(512, 512).png({ compressionLevel: 9 }).toFile(png512Path);

  // Validar escritura
  const [s192, s512] = await Promise.all([
    fs.stat(png192Path),
    fs.stat(png512Path),
  ]);

  console.log('✅ Generados:', {
    'icon-192.png': `${(s192.size / 1024).toFixed(1)} KB`,
    'icon-512.png': `${(s512.size / 1024).toFixed(1)} KB`,
  });
}

main().catch((err) => {
  console.error('Error generando iconos:', err);
  process.exit(1);
});


