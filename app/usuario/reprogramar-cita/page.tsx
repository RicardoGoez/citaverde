"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Check,
  X
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCitas, updateCita, getHorariosEspeciales } from "@/lib/actions/database";
import { useToasts } from "@/lib/hooks/use-toast";

function ReprogramarCitaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const citaId = searchParams.get('cita');
  const token = searchParams.get('token');
  const { success, error: showError } = useToasts();

  const [cita, setCita] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [fechasBloqueadas, setFechasBloqueadas] = useState<string[]>([]);
  const [mesActual, setMesActual] = useState(new Date());

  const [formData, setFormData] = useState({
    fecha: '',
    hora: ''
  });

  const horasDisponibles = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

  const nombresMes = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  useEffect(() => {
    const loadCita = async () => {
      if (!citaId) {
        setLoading(false);
        return;
      }

      try {
        const citas = await getCitas();
        const citaEncontrada = citas.find((c: any) => c.id === citaId);
        
        if (!citaEncontrada) {
          showError("Error", "Cita no encontrada");
          router.push('/cita-error?reason=not-found');
          return;
        }

        // Validar token
        if (citaEncontrada.confirmation_token !== token) {
          showError("Error", "Token inválido");
          router.push('/cita-error?reason=invalid-token');
          return;
        }

        // Validar que no esté cancelada o completada
        if (citaEncontrada.estado === 'cancelada') {
          showError("Error", "Esta cita ya fue cancelada");
          router.push('/cita-error?reason=already-cancelled');
          return;
        }

        if (citaEncontrada.estado === 'completada') {
          showError("Error", "Esta cita ya fue completada");
          router.push('/cita-error?reason=already-completed');
          return;
        }

        setCita(citaEncontrada);
        
        // Cargar festivos de la sede
        if (citaEncontrada.sede_id) {
          try {
            const horariosEspeciales = await getHorariosEspeciales(citaEncontrada.sede_id);
            const festivos = horariosEspeciales
              .filter((horario: any) => horario.es_festivo)
              .map((horario: any) => horario.fecha);
            setFechasBloqueadas(festivos);
          } catch (error) {
            console.error("Error cargando festivos:", error);
          }
        }
      } catch (error) {
        console.error("Error cargando cita:", error);
        showError("Error", "Error al cargar la cita");
      } finally {
        setLoading(false);
      }
    };

    loadCita();
  }, [citaId, token, router, showError]);

  // Cargar horas ocupadas
  useEffect(() => {
    const loadHorasOcupadas = async () => {
      if (!cita || !formData.fecha) {
        setHorasOcupadas([]);
        return;
      }

      try {
        const citasData = await getCitas();
        const citasFiltradas = citasData.filter((c: any) => 
          c.profesional_id === cita.profesional_id && 
          c.fecha === formData.fecha &&
          c.estado !== 'cancelada' &&
          c.id !== cita.id // Excluir la cita actual
        );

        const ocupadas = citasFiltradas.map((c: any) => c.hora);
        setHorasOcupadas(ocupadas);
      } catch (error) {
        console.error("Error cargando horas ocupadas:", error);
        setHorasOcupadas([]);
      }
    };

    loadHorasOcupadas();
  }, [cita, formData.fecha]);

  const generarDiasDelCalendario = () => {
    const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
    const diaInicial = primerDia.getDay();
    const diasEnMes = ultimoDia.getDate();
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const dias = [];
    
    for (let i = 0; i < diaInicial; i++) {
      dias.push(null);
    }
    
    for (let i = 1; i <= diasEnMes; i++) {
      const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), i);
      const fechaStr = fecha.toISOString().split('T')[0];
      const diaSemana = fecha.getDay();
      
      const esPasado = fecha < hoy;
      const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
      const esFestivo = fechasBloqueadas.includes(fechaStr);
      const esValido = !esPasado && !esFinDeSemana && !esFestivo;
      
      dias.push({
        dia: i,
        fechaStr,
        esPasado,
        esFinDeSemana,
        esFestivo,
        esValido
      });
    }
    
    return dias;
  };

  const isFechaValida = (fechaStr: string): boolean => {
    if (!fechaStr) return false;
    if (fechasBloqueadas.includes(fechaStr)) return false;

    const fecha = new Date(fechaStr);
    const diaSemana = fecha.getDay();
    if (diaSemana === 0 || diaSemana === 6) return false;

    return true;
  };

  const handleSubmit = async () => {
    if (!formData.fecha || !formData.hora) {
      showError("Error", "Selecciona una fecha y hora");
      return;
    }

    if (!isFechaValida(formData.fecha)) {
      showError("Error", "No se pueden agendar citas en fines de semana ni días festivos");
      return;
    }

    if (horasOcupadas.includes(formData.hora)) {
      showError("Error", "Esta hora ya está ocupada");
      return;
    }

    try {
      setSubmitting(true);
      await updateCita(citaId!, {
        fecha: formData.fecha,
        hora: formData.hora,
        updated_at: new Date().toISOString()
      });

      success("Cita reprogramada", "Tu cita ha sido reprogramada exitosamente");
      
      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        router.push('/cita-confirmada?cita=' + citaId);
      }, 1500);
    } catch (err: any) {
      console.error("Error reprogramando cita:", err);
      showError("Error", err.message || "No se pudo reprogramar la cita");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16A34A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Reprogramar Cita</h1>
            <p className="text-base text-gray-600">Selecciona una nueva fecha y hora para tu cita</p>
          </div>

          {/* Información de la cita actual */}
          {cita && (
            <Card className="border border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Cita Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-gray-700">
                  <div><strong>Servicio:</strong> {cita.servicio}</div>
                  <div><strong>Fecha actual:</strong> {new Date(cita.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                  <div><strong>Hora actual:</strong> {cita.hora}</div>
                  {cita.profesional && <div><strong>Profesional:</strong> {cita.profesional}</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Formulario de reprogramación */}
          <Card className="border border-[#E5E7EB] shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Nueva Fecha y Hora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Calendario */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Selecciona la Nueva Fecha</Label>
                <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
                  {/* Header del Calendario */}
                  <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-gray-50">
                    <button
                      onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))}
                      className="p-2 hover:bg-gray-200 rounded transition"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h3 className="font-semibold text-[#111827]">
                      {nombresMes[mesActual.getMonth()]} {mesActual.getFullYear()}
                    </h3>
                    <button
                      onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))}
                      className="p-2 hover:bg-gray-200 rounded transition"
                    >
                      <ArrowLeft className="h-5 w-5 rotate-180" />
                    </button>
                  </div>

                  {/* Días de la semana */}
                  <div className="grid grid-cols-7 p-2 bg-gray-50 border-b border-[#E5E7EB]">
                    {diasSemana.map((dia) => (
                      <div key={dia} className="text-center text-sm font-medium text-[#6B7280]">
                        {dia}
                      </div>
                    ))}
                  </div>

                  {/* Días del mes */}
                  <div className="grid grid-cols-7 p-2 gap-1">
                    {generarDiasDelCalendario().map((dia, index) => (
                      <div key={index} className="aspect-square">
                        {dia ? (
                          <button
                            onClick={() => {
                              if (dia.esValido) {
                                setFormData({ ...formData, fecha: dia.fechaStr });
                              }
                            }}
                            disabled={!dia.esValido}
                            className={`
                              w-full h-full rounded-md text-sm font-medium transition-all
                              ${!dia.esValido
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                : formData.fecha === dia.fechaStr
                                  ? 'bg-[#16A34A] text-white border-2 border-[#16A34A]'
                                  : 'hover:bg-[#F0FDF4] hover:border-[#16A34A] border-2 border-transparent'
                              }
                              ${dia.esFestivo && 'bg-red-50 text-red-500'}
                            `}
                            title={dia.esFestivo ? 'Día festivo' : dia.esFinDeSemana ? 'Fin de semana' : ''}
                          >
                            {dia.dia}
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-transparent bg-[#16A34A] rounded"></div>
                    <span className="text-xs text-[#6B7280]">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-transparent bg-gray-100 rounded"></div>
                    <span className="text-xs text-[#6B7280]">Bloqueado</span>
                  </div>
                </div>
              </div>

              {/* Horas */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Selecciona la Nueva Hora</Label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {horasDisponibles.map((hora) => {
                    const estaOcupada = horasOcupadas.includes(hora);
                    return (
                      <button
                        key={hora}
                        onClick={() => !estaOcupada && setFormData({ ...formData, hora })}
                        disabled={estaOcupada}
                        className={`
                          px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium
                          ${estaOcupada
                            ? 'border-[#D1D5DB] bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed opacity-60'
                            : formData.hora === hora 
                              ? 'border-[#16A34A] bg-[#F0FDF4] text-[#16A34A]' 
                              : 'border-[#E5E7EB] hover:border-[#16A34A] hover:bg-[#F9FAFB] text-[#111827]'
                          }
                        `}
                      >
                        {hora}
                      </button>
                    );
                  })}
                </div>
                {horasOcupadas.length > 0 && (
                  <p className="text-sm text-[#6B7280] mt-3">
                    Las horas marcadas en gris ya están ocupadas
                  </p>
                )}
              </div>

              {/* Botones */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                <Button
                  variant="outline"
                  onClick={() => router.push('/cita-error?reason=cancelled')}
                  className="flex items-center gap-2"
                >
                  Cancelar
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.fecha || !formData.hora}
                  className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D]"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Reprogramando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirmar Reprogramación
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ReprogramarCitaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16A34A]"></div>
      </div>
    }>
      <ReprogramarCitaContent />
    </Suspense>
  );
}

