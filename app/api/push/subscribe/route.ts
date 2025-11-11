import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * API para guardar suscripciones de push notifications
 * POST /api/push/subscribe
 */
export async function POST(request: NextRequest) {
  try {
    // Validar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("⚠️ Variables de Supabase no configuradas. Guardando suscripción solo en localStorage.");
      // Si no hay Supabase configurado, solo retornar éxito (la suscripción se guarda en localStorage del cliente)
      const body = await request.json();
      return NextResponse.json({ 
        success: true, 
        message: "Suscripción guardada localmente (Supabase no configurado)" 
      });
    }

    // Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { subscription, userId } = body;

    if (!subscription || !userId) {
      return NextResponse.json(
        { success: false, error: "Subscription y userId son requeridos" },
        { status: 400 }
      );
    }

    // Guardar suscripción en la base de datos
    // Nota: Necesitarías crear una tabla 'push_subscriptions' en Supabase
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert({
        user_id: userId,
        subscription: subscription,
        endpoint: subscription.endpoint,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id"
      });

    if (error) {
      console.error("Error guardando suscripción:", error);
      return NextResponse.json(
        { success: false, error: "Error guardando suscripción" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error en /api/push/subscribe:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

