"use client";

import { NotificationService } from "./notifications";

interface CustomNotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface CustomNotificationOptions extends NotificationOptions {
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  actions?: CustomNotificationAction[];
  vibrate?: number[];
}

/**
 * Servicio para manejar notificaciones push del navegador
 */
export class PushNotificationService {
  private static registration: ServiceWorkerRegistration | null = null;

  /**
   * Inicializar el servicio de notificaciones push
   */
  static async initialize(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("⚠️ Push notifications no soportadas en este navegador");
      return false;
    }

    try {
      // Registrar service worker si no está registrado
      const registration = await navigator.serviceWorker.ready;
      this.registration = registration;

      // Solicitar permisos
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        console.warn("⚠️ Permisos de notificación denegados");
        return false;
      }

      // Suscribirse a push notifications (solo si hay clave VAPID)
      // Nota: Para producción, necesitarías configurar VAPID keys
      // Por ahora, usamos notificaciones locales del Service Worker
      let subscription = null;
      try {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          const keyArray = this.urlBase64ToUint8Array(vapidKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyArray.buffer as ArrayBuffer,
          });
        }
      } catch (error) {
        console.warn("No se pudo suscribir a push notifications (VAPID no configurado):", error);
      }

      // Enviar suscripción al servidor
      await this.sendSubscriptionToServer(subscription);

      console.log("✅ Notificaciones push inicializadas");
      return true;
    } catch (error) {
      console.error("❌ Error inicializando push notifications:", error);
      return false;
    }
  }

  /**
   * Enviar notificación push
   */
  static async sendPushNotification(
    title: string,
    options: CustomNotificationOptions
  ): Promise<boolean> {
    if (!this.registration) {
      // Intentar inicializar si no está inicializado
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
    }

    try {
      // Preparar opciones de notificación
      const notificationOptions: any = {
        body: options.body || "",
        icon: options.icon || "/icon-192.png",
        badge: options.badge || "/icon-192.png",
        tag: options.tag || "citaverde-notification",
        data: options.data || {},
        requireInteraction: options.requireInteraction || false,
        ...options,
      };

      // Agregar vibrate si está disponible (no es parte del estándar pero lo soportan los navegadores)
      if (options.vibrate && "vibrate" in navigator) {
        notificationOptions.vibrate = options.vibrate;
      }

      // Agregar acciones si están disponibles
      if (options.actions && options.actions.length > 0) {
        notificationOptions.actions = options.actions;
      }

      await this.registration!.showNotification(title, notificationOptions);

      return true;
    } catch (error) {
      console.error("❌ Error enviando push notification:", error);
      return false;
    }
  }

  /**
   * Notificar evento de cita
   */
  static async notifyCitaEvent(
    type: "confirmada" | "cancelada" | "reprogramada" | "recordatorio" | "proxima",
    cita: {
      servicio: string;
      fecha: string;
      hora: string;
      profesional?: string;
      id?: string;
    }
  ): Promise<boolean> {
    const titles: Record<string, string> = {
      confirmada: "✅ Cita Confirmada",
      cancelada: "❌ Cita Cancelada",
      reprogramada: "🔄 Cita Reprogramada",
      recordatorio: "⏰ Recordatorio de Cita",
      proxima: "📅 Próxima Cita",
    };

    const messages: Record<string, string> = {
      confirmada: `Tu cita para ${cita.servicio} ha sido confirmada`,
      cancelada: `Tu cita para ${cita.servicio} ha sido cancelada`,
      reprogramada: `Tu cita ha sido reprogramada para ${cita.fecha} a las ${cita.hora}`,
      recordatorio: `Recuerda tu cita de ${cita.servicio} mañana a las ${cita.hora}`,
      proxima: `Tienes una cita de ${cita.servicio} hoy a las ${cita.hora}`,
    };

    return await this.sendPushNotification(titles[type], {
      body: messages[type],
      tag: `cita-${cita.id || "new"}`,
      data: {
        type: "cita",
        event: type,
        citaId: cita.id,
        url: cita.id ? `/usuario/mis-citas` : "/usuario",
      },
      requireInteraction: type === "proxima",
      actions: [
        {
          action: "view",
          title: "Ver Cita",
        } as CustomNotificationAction,
        {
          action: "dismiss",
          title: "Cerrar",
        } as CustomNotificationAction,
      ],
    });
  }

  /**
   * Notificar evento de turno
   */
  static async notifyTurnoEvent(
    type: "obtenido" | "listo" | "proximo" | "cancelado",
    turno: {
      numero: number;
      servicio: string;
      cola?: string;
      turnosAntes?: number;
    }
  ): Promise<boolean> {
    const titles: Record<string, string> = {
      obtenido: "🎫 Turno Obtenido",
      listo: "🚨 ¡Es Tu Turno!",
      proximo: "⏰ Turno Próximo",
      cancelado: "❌ Turno Cancelado",
    };

    const messages: Record<string, string> = {
      obtenido: `Turno #${turno.numero} para ${turno.servicio}`,
      listo: `¡Es tu turno #${turno.numero}! Acércate a la recepción`,
      proximo: `Tu turno #${turno.numero} está próximo (${turno.turnosAntes} turnos antes)`,
      cancelado: `Tu turno #${turno.numero} ha sido cancelado`,
    };

    return await this.sendPushNotification(titles[type], {
      body: messages[type],
      tag: `turno-${turno.numero}`,
      data: {
        type: "turno",
        event: type,
        numero: turno.numero,
        url: "/usuario/tracking",
      },
      requireInteraction: type === "listo",
      vibrate: type === "listo" ? [300, 200, 300, 200, 300] : [200, 100, 200],
      actions:
        type === "listo"
          ? [
              {
                action: "view",
                title: "Ver Turno",
              } as CustomNotificationAction,
            ]
          : [],
    });
  }

  /**
   * Convertir clave VAPID de base64 URL a Uint8Array
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (!base64String) {
      return new Uint8Array(0);
    }

    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array;
  }

  /**
   * Enviar suscripción al servidor
   */
  private static async sendSubscriptionToServer(
    subscription: PushSubscription | null
  ): Promise<void> {
    try {
      if (!subscription) {
        return;
      }

      // Guardar suscripción en localStorage para uso local
      const subscriptionJson = JSON.stringify(subscription.toJSON());
      localStorage.setItem("push-subscription", subscriptionJson);

      // Obtener userId del sessionStorage
      const userStr = sessionStorage.getItem("user");
      if (!userStr) {
        console.warn("No hay usuario autenticado para guardar suscripción");
        return;
      }

      const user = JSON.parse(userStr);

      // Enviar al servidor
      try {
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            userId: user.id
          })
        });

        if (response.ok) {
          console.log("✅ Suscripción guardada en servidor");
        } else {
          console.warn("⚠️ No se pudo guardar suscripción en servidor (puede que la tabla no exista)");
        }
      } catch (fetchError) {
        console.warn("⚠️ Error enviando suscripción al servidor:", fetchError);
        // No es crítico, las notificaciones locales seguirán funcionando
      }
    } catch (error) {
      console.error("Error guardando suscripción:", error);
    }
  }
}

