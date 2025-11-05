"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") || "signup";
  const error = searchParams.get("error");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (error) {
      setStatus("error");
      if (error === "token_requerido") {
        setMessage("Token de verificación no encontrado");
      } else {
        setMessage("Error al procesar la verificación");
      }
      return;
    }

    if (token_hash) {
      verifyEmail(token_hash, type);
    } else {
      setStatus("error");
      setMessage("Token de verificación no encontrado. Por favor, revisa el enlace en tu email.");
    }
  }, [token_hash, type, error]);

  const verifyEmail = async (verificationToken: string, verificationType: string) => {
    try {
      // Verificar el email usando Supabase Auth
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: verificationToken,
        type: verificationType as any,
      });

      if (verifyError) {
        console.error("Error verificando email:", verifyError);
        setStatus("error");
        
        if (verifyError.message.includes("expired")) {
          setMessage("El enlace de verificación ha expirado. Solicita uno nuevo.");
        } else if (verifyError.message.includes("already confirmed")) {
          setStatus("success");
          setMessage("Tu email ya está verificado. Puedes iniciar sesión.");
        } else {
          setMessage("Token de verificación inválido o expirado. Solicita uno nuevo.");
        }
        return;
      }

      if (data.user) {
        // Actualizar el estado en la tabla usuarios
        try {
          await fetch("/api/verify-email", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: data.user.id }),
          });
        } catch (updateError) {
          console.error("Error actualizando estado:", updateError);
          // No fallar si solo falla la actualización de la tabla
        }

        setStatus("success");
        setMessage("¡Email verificado exitosamente! Ya puedes iniciar sesión.");
      } else {
        setStatus("error");
        setMessage("No se pudo verificar el usuario.");
      }
    } catch (error) {
      console.error("Error verificando email:", error);
      setStatus("error");
      setMessage("Error al verificar el email. Intenta nuevamente.");
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setMessage("Por favor ingresa tu email para reenviar el correo de verificación");
      return;
    }

    setResending(true);
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Email de verificación reenviado. Revisa tu bandeja de entrada.");
        setStatus("loading");
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("Error al reenviar el email. Intenta nuevamente.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#dcfce7] via-white to-[#bbf7d0] px-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {status === "loading" && (
                <Loader2 className="h-16 w-16 text-[#16a34a] animate-spin" />
              )}
              {status === "success" && (
                <CheckCircle className="h-16 w-16 text-[#16a34a]" />
              )}
              {status === "error" && (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {status === "loading" && "Verificando Email..."}
              {status === "success" && "¡Email Verificado!"}
              {status === "error" && "Error de Verificación"}
            </CardTitle>
            <CardDescription className="mt-2">{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "success" && (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Tu email ha sido verificado exitosamente. Ahora puedes iniciar sesión.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white"
                >
                  Ir a Iniciar Sesión
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600 text-center">
                    ¿No recibiste el email de verificación?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                    />
                    <Button
                      onClick={handleResendEmail}
                      disabled={resending}
                      variant="outline"
                      className="border-[#16a34a] text-[#16a34a] hover:bg-[#16a34a] hover:text-white"
                    >
                      {resending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Reenviar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <Link
                    href="/login"
                    className="text-sm text-[#16a34a] hover:underline block"
                  >
                    Volver a Iniciar Sesión
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm text-gray-600 hover:underline block"
                  >
                    Crear Nueva Cuenta
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

