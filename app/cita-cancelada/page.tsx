"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getCitas } from "@/lib/actions/database";

function CitaCanceladaContent() {
  const searchParams = useSearchParams();
  const citaId = searchParams.get('cita');
  const [cita, setCita] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCita = async () => {
      if (!citaId) {
        setLoading(false);
        return;
      }

      try {
        const citas = await getCitas();
        const citaEncontrada = citas.find((c: any) => c.id === citaId);
        setCita(citaEncontrada);
      } catch (error) {
        console.error("Error cargando cita:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCita();
  }, [citaId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-red-500 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              {/* Ícono */}
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-6">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>

              {/* Título */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Cita Cancelada
              </h1>
              <p className="text-gray-600 mb-8">
                Tu cita ha sido cancelada exitosamente
              </p>

              {/* Mensaje informativo */}
              {cita && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <p className="text-gray-900 font-semibold mb-2">
                    Cita Cancelada:
                  </p>
                  <p className="text-gray-700">
                    {cita.servicio} - {cita.fecha} a las {cita.hora}
                  </p>
                </div>
              )}

              {/* Información adicional */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-yellow-900">
                  El espacio de tu cita está ahora disponible para otros usuarios. 
                  Puedes reservar una nueva cita cuando lo desees.
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-[#2563EB] hover:bg-[#1E40AF]" asChild>
                  <Link href="/usuario/reservar">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reservar Nueva Cita
                  </Link>
                </Button>
                <Button variant="outline" asChild>
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

export default function CitaCanceladaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    }>
      <CitaCanceladaContent />
    </Suspense>
  );
}
