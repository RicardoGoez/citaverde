"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, User, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getCitas } from "@/lib/actions/database";

function CitaConfirmadaContent() {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16A34A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-2 border-green-500 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              {/* Ícono de éxito */}
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>

              {/* Título */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ¡Cita Confirmada!
              </h1>
              <p className="text-gray-600 mb-8">
                Tu cita ha sido confirmada exitosamente
              </p>

              {/* Información de la cita */}
              {cita && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-600">Servicio:</span>
                    <span className="font-semibold text-gray-900">{cita.servicio}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-semibold text-gray-900">{cita.fecha}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-600">Hora:</span>
                    <span className="font-semibold text-gray-900">{cita.hora}</span>
                  </div>
                  
                  {cita.profesional && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-600" />
                      <span className="text-gray-600">Profesional:</span>
                      <span className="font-semibold text-gray-900">{cita.profesional}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Mensaje informativo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-900">
                  Recibirás un recordatorio 24 horas antes de tu cita. 
                  Por favor, presenta tu código QR al llegar.
                </p>
              </div>

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

export default function CitaConfirmadaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16A34A]"></div>
      </div>
    }>
      <CitaConfirmadaContent />
    </Suspense>
  );
}
