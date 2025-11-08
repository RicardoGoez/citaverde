import { NextRequest, NextResponse } from "next/server";
import { resendVerificationEmail } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/verify-email?token_hash=xxx&type=xxx - Callback de Supabase Auth para verificación
 * Esta ruta es llamada automáticamente por Supabase cuando el usuario hace clic en el link de verificación
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") || "signup";

    // Si no hay token_hash, redirigir a la página de verificación
    if (!token_hash) {
      return NextResponse.redirect(
        new URL('/verify-email?error=token_requerido', request.url)
      );
    }

    // Redirigir a la página de verificación con el token
    // La página manejará la verificación usando el cliente de Supabase
    return NextResponse.redirect(
      new URL(`/verify-email?token_hash=${token_hash}&type=${type}`, request.url)
    );
  } catch (error) {
    console.error("Error en API verify-email callback:", error);
    return NextResponse.redirect(
      new URL('/verify-email?error=error_procesando', request.url)
    );
  }
}

/**
 * POST /api/verify-email - Reenviar email de verificación
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email requerido" },
        { status: 400 }
      );
    }

    // Reenviar email usando Supabase Auth
    const result = await resendVerificationEmail(email);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("Error en API resend verification:", error);
    return NextResponse.json(
      { success: false, message: "Error al reenviar email" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/verify-email - Actualizar estado de verificación en tabla usuarios
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "UserId requerido" },
        { status: 400 }
      );
    }

    // Actualizar el registro en la tabla usuarios
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        email_verificado: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error actualizando verificación:', updateError);
      return NextResponse.json(
        { success: false, message: "Error al actualizar estado" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error en API update verification:", error);
    return NextResponse.json(
      { success: false, message: "Error al actualizar estado" },
      { status: 500 }
    );
  }
}
