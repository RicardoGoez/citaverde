"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CitaErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const getErrorMessage = (reason: string | null) => {
    switch (reason) {
      case 'no-token':
        return {
          title: 'Token no proporcionado',
          message: 'No se proporcionó un token de validación. Por favor, usa el enlace del email.'
        };
      case 'invalid-token':
        return {
          title: 'Token inválido',
          message: 'El token de validación no es correcto o ha expirado.'
        };
      case 'not-found':
        return {
          title: 'Cita no encontrada',
          message: 'No se pudo encontrar la cita solicitada.'
        };
      case 'already-cancelled':
        return {
          title: 'Cita ya cancelada',
          message: 'Esta cita ya fue cancelada anteriormente.'
        };
      case 'already-completed':
        return {
          title: 'Cita ya completada',
          message: 'Esta cita ya fue completada y no puede ser modificada.'
        };
      case 'already-confirmed':
        return {
          title: 'Cita ya confirmada',
          message: 'Esta cita ya estaba confirmada.'
        };
      default:
        return {
          title: 'Error en el servidor',
          message: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'
        };
    }
  };

  const error = getErrorMessage(reason);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-yellow-500 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              {/* Ícono */}
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-100 mb-6">
                <AlertCircle className="h-16 w-16 text-yellow-600" />
              </div>

              {/* Título y mensaje */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {error.title}
              </h1>
              <p className="text-gray-600 mb-8">
                {error.message}
              </p>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-[#16A34A] hover:bg-[#15803D]"
                  asChild
                >
                  <Link href="/login">
                    Ver Mis Citas
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Volver al Inicio
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CitaErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    }>
      <CitaErrorContent />
    </Suspense>
  );
}

