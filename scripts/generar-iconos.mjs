// Genera icon-192.png e icon-512.png desde public/icon.svg
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

async function generate() {
  const root = process.cwd();
  const svgPath = path.join(root, 'public', 'icon.svg');
  const out192 = path.join(root, 'public', 'icon-192.png');
  const out512 = path.join(root, 'public', 'icon-512.png');

  const svg = await fs.readFile(svgPath);

  // Reemplazar existentes si están
  await Promise.allSettled([
    fs.unlink(out192),
    fs.unlink(out512)
  ]);

  await sharp(svg).resize(192, 192).png({ compressionLevel: 9 }).toFile(out192);
  await sharp(svg).resize(512, 512).png({ compressionLevel: 9 }).toFile(out512);

  const [s192, s512] = await Promise.all([fs.stat(out192), fs.stat(out512)]);
  console.log('✅ Iconos regenerados:', {
    'icon-192.png': `${(s192.size / 1024).toFixed(1)} KB`,
    'icon-512.png': `${(s512.size / 1024).toFixed(1)} KB`,
  });
}

generate().catch((err) => {
  console.error('❌ Error generando iconos:', err);
  process.exit(1);
});


