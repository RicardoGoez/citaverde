"use client";

import { useEffect, useState } from "react";

interface NotificationState {
  state: NotificationPermission;
  requesting: boolean;
}

interface CustomNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  sound?: boolean;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationState>({
    state: "default" as NotificationPermission,
    requesting: false,
  });

  useEffect(() => {
    if ("Notification" in window) {
      setPermission({
        state: Notification.permission,
        requesting: false,
      });
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.log("Este navegador no soporta notificaciones");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      setPermission({ state: "default" as NotificationPermission, requesting: true });
      const result = await Notification.requestPermission();
      setPermission({ state: result, requesting: false });
      return result === "granted";
    }

    return false;
  };

  const sendNotification = async (
    title: string,
    options?: CustomNotificationOptions
  ): Promise<void> => {
    const hasPermission = await requestPermission();
    
    if (!hasPermission) {
      console.log("Permisos de notificación no concedidos");
      return;
    }

    // Vibrar dispositivo si está soportado
    if ("vibrate" in navigator && options?.vibrate) {
      try {
        navigator.vibrate(options.vibrate);
      } catch (error) {
        console.log("Vibración no soportada:", error);
      }
    }

    // Crear notificación
    const { vibrate: _, sound: __, ...notificationOptions } = options || {};
    const notification = new Notification(title, {
      body: options?.body || "Tienes una notificación de CitaVerde",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: options?.tag || "citaverde-notification",
      requireInteraction: options?.requireInteraction || false,
      silent: options?.silent || false,
      ...notificationOptions,
    });

    // Cerrar notificación después de 5 segundos
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Reproducir sonido (si está soportado)
    if (options?.sound !== false) {
      playNotificationSound();
    }
  };

  const playNotificationSound = (): void => {
    try {
      // Crear un tono de beep usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar tono
      oscillator.frequency.value = 800; // Frecuencia en Hz
      oscillator.type = "sine";
      
      // Configurar volumen
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      // Reproducir
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Limpiar
      setTimeout(() => {
        audioContext.close();
      }, 500);
    } catch (error) {
      console.log("No se pudo reproducir sonido:", error);
    }
  };

  return {
    permission: permission.state,
    requesting: permission.requesting,
    supported: "Notification" in window && "vibrate" in navigator,
    requestPermission,
    sendNotification,
    playNotificationSound,
  };
}

