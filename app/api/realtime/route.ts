import { NextRequest } from "next/server";
import { getCitas, getTurnos } from "@/lib/actions/database";

/**
 * Server-Sent Events (SSE) para actualizaciones en tiempo real
 * Alternativa más simple que WebSockets para Next.js
 */
export async function GET(request: NextRequest) {
  // Crear un ReadableStream para SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Enviar mensaje inicial de conexión
      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      send({ type: 'connected', timestamp: new Date().toISOString() });

      // Función para obtener y enviar datos actualizados
      const broadcastUpdate = async () => {
        try {
          const [citas, turnos] = await Promise.all([
            getCitas(),
            getTurnos()
          ]);

          send({
            type: 'update',
            data: {
              citas: citas.length,
              turnos: turnos.length,
              citasHoy: citas.filter((c: any) => {
                const hoy = new Date().toISOString().split('T')[0];
                return c.fecha === hoy;
              }).length,
              turnosActivos: turnos.filter((t: any) => 
                t.estado === 'en_espera' || t.estado === 'en_atencion'
              ).length,
            },
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error en broadcastUpdate:', error);
          send({ type: 'error', message: 'Error obteniendo datos' });
        }
      };

      // Enviar actualización inicial
      await broadcastUpdate();

      // Enviar actualizaciones periódicas cada 5 segundos
      const interval = setInterval(broadcastUpdate, 5000);

      // Mantener conexión viva con heartbeat
      const heartbeat = setInterval(() => {
        send({ type: 'heartbeat', timestamp: new Date().toISOString() });
      }, 30000); // Cada 30 segundos

      // Limpiar cuando el cliente se desconecta
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Deshabilitar buffering en Nginx
    },
  });
}

