"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface RealtimeData {
  citas: number;
  turnos: number;
  citasHoy: number;
  turnosActivos: number;
}

interface RealtimeState {
  connected: boolean;
  data: RealtimeData | null;
  error: string | null;
  lastUpdate: Date | null;
}

/**
 * Hook para conectarse a actualizaciones en tiempo real usando Server-Sent Events
 */
export function useRealtime() {
  const [state, setState] = useState<RealtimeState>({
    connected: false,
    data: null,
    error: null,
    lastUpdate: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    // Cerrar conexión existente si hay una
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource('/api/realtime');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ Conexión SSE establecida');
        setState(prev => ({
          ...prev,
          connected: true,
          error: null,
        }));
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            console.log('🔗 Conectado al servidor en tiempo real');
          } else if (data.type === 'update') {
            setState(prev => ({
              ...prev,
              data: data.data,
              lastUpdate: new Date(),
            }));
          } else if (data.type === 'heartbeat') {
            // Mantener conexión viva
            console.log('💓 Heartbeat recibido');
          } else if (data.type === 'error') {
            setState(prev => ({
              ...prev,
              error: data.message || 'Error desconocido',
            }));
          }
        } catch (error) {
          console.error('Error parseando mensaje SSE:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ Error en conexión SSE:', error);
        setState(prev => ({
          ...prev,
          connected: false,
          error: 'Error de conexión',
        }));

        // Intentar reconectar
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Intentando reconectar (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            connect();
          }, delay);
        } else {
          console.error('❌ Máximo de intentos de reconexión alcanzado');
          setState(prev => ({
            ...prev,
            error: 'No se pudo establecer conexión',
          }));
        }
      };
    } catch (error) {
      console.error('Error creando EventSource:', error);
      setState(prev => ({
        ...prev,
        connected: false,
        error: 'Error inicializando conexión',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setState({
      connected: false,
      data: null,
      error: null,
      lastUpdate: null,
    });
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect: connect,
  };
}

