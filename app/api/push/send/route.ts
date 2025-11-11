import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Configurar VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@citaverde.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

/**
 * API para enviar notificaciones push desde el servidor
 * POST /api/push/send
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que VAPID esté configurado
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: "VAPID keys no configuradas. Ejecuta 'npm run setup:vapid' para generar las claves automáticamente" 
        },
        { status: 500 }
      );
    }

    // Validar variables de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Variables de Supabase no configuradas. Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY" 
        },
        { status: 500 }
      );
    }

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { userId, title, options } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { success: false, error: "userId y title son requeridos" },
        { status: 400 }
      );
    }

    // Obtener suscripción del usuario
    const { data: subscriptionData, error: subError } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", userId)
      .single();

    if (subError || !subscriptionData) {
      return NextResponse.json(
        { success: false, error: "Usuario no tiene suscripción push activa" },
        { status: 404 }
      );
    }

    const subscription = subscriptionData.subscription;

    // Preparar payload de notificación
    const payload = JSON.stringify({
      title: title,
      body: options?.body || "",
      icon: options?.icon || "/icon-192.png",
      badge: options?.badge || "/icon-192.png",
      tag: options?.tag || "citaverde-notification",
      data: options?.data || {},
      requireInteraction: options?.requireInteraction || false,
      vibrate: options?.vibrate || [200, 100, 200],
      actions: options?.actions || [],
    });

    // Enviar notificación
    try {
      await webpush.sendNotification(subscription, payload);
      return NextResponse.json({ success: true, message: "Notificación enviada" });
    } catch (error: any) {
      console.error("Error enviando push notification:", error);
      
      // Si la suscripción es inválida, eliminarla
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", userId);
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error en /api/push/send:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

