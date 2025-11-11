"use client";

import { useEffect } from "react";
import { PushNotificationService } from "@/lib/services/push-notifications";

/**
 * Componente para inicializar notificaciones push
 * Se monta una vez en el layout principal
 */
export function PushNotificationsSetup() {
  useEffect(() => {
    // Inicializar notificaciones push cuando la app carga
    const initPushNotifications = async () => {
      try {
        // Esperar un poco para que el service worker esté listo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Inicializar push notifications
        await PushNotificationService.initialize();
      } catch (error) {
        console.warn("No se pudieron inicializar las notificaciones push:", error);
      }
    };

    // Solo inicializar si el navegador soporta notificaciones
    if ("Notification" in window && "serviceWorker" in navigator) {
      initPushNotifications();
    }
  }, []);

  return null; // Este componente no renderiza nada
}

