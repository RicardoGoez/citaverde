import QRCode from 'qrcode';

/**
 * Genera un código QR como string en formato Data URL
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (err) {
    console.error('Error generando QR:', err);
    throw new Error('Error al generar el código QR');
  }
}

/**
 * Genera un código QR y lo convierte a Blob
 */
export async function generateQRCodeBlob(data: string): Promise<Blob> {
  try {
    const dataUrl = await generateQRCode(data);
    const response = await fetch(dataUrl);
    return await response.blob();
  } catch (err) {
    console.error('Error generando QR blob:', err);
    throw new Error('Error al generar el código QR');
  }
}

/**
 * Descarga el QR como imagen
 */
export function downloadQRCode(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Genera un token único para la cita o turno
 */
export function generateQRToken(id: string, tipo: 'cita' | 'turno', userId: string): string {
  const timestamp = Date.now();
  const data = {
    id,
    tipo,
    userId,
    timestamp,
  };
  return btoa(JSON.stringify(data));
}

/**
 * Valida y decodifica un token QR
 */
export function validateQRToken(token: string): { id: string; tipo: string; userId: string; timestamp: number } | null {
  try {
    const data = JSON.parse(atob(token));
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas
    
    if (Date.now() - data.timestamp > maxAge) {
      return null; // Token expirado
    }
    
    return data;
  } catch (err) {
    return null; // Token inválido
  }
}
