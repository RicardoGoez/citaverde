"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { getSedes, getServicios, getProfesionales, createCita, getCitas, getHorariosEspeciales } from "@/lib/actions/database";
import { useToasts } from "@/lib/hooks/use-toast";
import { useRouter } from "next/navigation";
import { NotificationService } from "@/lib/services/notifications";

export default function ReservarCita() {
  const router = useRouter();
  const { success, error: showError } = useToasts();
  
  const [step, setStep] = useState(1);
  const [sedes, setSedes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [fechasBloqueadas, setFechasBloqueadas] = useState<string[]>([]);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [mesActual, setMesActual] = useState(new Date());

  const [formData, setFormData] = useState({
    sede: '',
    servicio: '',
    profesional: '',
    fecha: '',
    hora: ''
  });

  const horasDisponibles = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

  // Nombres de mes y días
  const nombresMes = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sedesData, serviciosData, profesionalesData] = await Promise.all([
          getSedes(),
          getServicios(),
          getProfesionales()
        ]);
        
        setSedes(sedesData);
        setServicios(serviciosData);
        setProfesionales(profesionalesData);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Cargar fechas bloqueadas (festivos) cuando se selecciona sede
  useEffect(() => {
    const loadFechasBloqueadas = async () => {
      if (!formData.sede) {
        setFechasBloqueadas([]);
        return;
      }

      try {
        const horariosEspeciales = await getHorariosEspeciales(formData.sede);
        
        // Filtrar solo los festivos
        const festivos = horariosEspeciales
          .filter((horario: any) => horario.es_festivo)
          .map((horario: any) => horario.fecha);
        
        setFechasBloqueadas(festivos);
      } catch (error) {
        console.error("Error cargando horarios especiales:", error);
        setFechasBloqueadas([]);
      }
    };

    loadFechasBloqueadas();
  }, [formData.sede]);

  // Cargar horas ocupadas cuando se selecciona profesional y fecha
  useEffect(() => {
    const loadHorasOcupadas = async () => {
      if (!formData.profesional || !formData.fecha || step !== 4) {
        setHorasOcupadas([]);
        return;
      }

      try {
        // Obtener todas las citas del profesional en esa fecha
        const citas = await getCitas();
        const citasFiltradas = citas.filter((cita: any) => 
          cita.profesional_id === formData.profesional && 
          cita.fecha === formData.fecha &&
          cita.estado !== 'cancelada'
        );

        // Extraer las horas ocupadas
        const ocupadas = citasFiltradas.map((cita: any) => cita.hora);
        setHorasOcupadas(ocupadas);
      } catch (error) {
        console.error("Error cargando horas ocupadas:", error);
        setHorasOcupadas([]);
      }
    };

    loadHorasOcupadas();
  }, [formData.profesional, formData.fecha, step]);

  // Verificar si una fecha es válida (no es fin de semana ni festivo)
  const isFechaValida = (fechaStr: string): boolean => {
    if (!fechaStr) return false;
    
    // Verificar si es festivo
    if (fechasBloqueadas.includes(fechaStr)) {
      return false;
    }

    // Verificar si es fin de semana
    const fecha = new Date(fechaStr);
    const diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado
    if (diaSemana === 0 || diaSemana === 6) {
      return false;
    }

    return true;
  };

  // Generar días del calendario
  const generarDiasDelCalendario = () => {
    const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
    const diaInicial = primerDia.getDay();
    const diasEnMes = ultimoDia.getDate();
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const dias = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < diaInicial; i++) {
      dias.push(null);
    }
    
    // Días del mes
    for (let i = 1; i <= diasEnMes; i++) {
      const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), i);
      const fechaStr = fecha.toISOString().split('T')[0];
      const diaSemana = fecha.getDay();
      
      // Verificar si es pasado
      const esPasado = fecha < hoy;
      // Verificar si es fin de semana
      const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
      // Verificar si es festivo
      const esFestivo = fechasBloqueadas.includes(fechaStr);
      // Verificar si es válido para seleccionar
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

  const handleNext = () => {
    if (step === 1 && formData.sede) setStep(2);
    else if (step === 2 && formData.servicio) setStep(3);
    else if (step === 3 && formData.profesional) setStep(4);
    else if (step === 4 && formData.fecha && formData.hora) {
      // Validar que la fecha sea válida antes de continuar
      if (!isFechaValida(formData.fecha)) {
        showError("Error", "No se pueden agendar citas en fines de semana ni días festivos.");
        return;
      }
      setStep(5);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const userStr = sessionStorage.getItem("user");
      if (!userStr) {
        showError("Error", "Sesión expirada");
        router.push("/login");
        return;
      }

      const user = JSON.parse(userStr);
      const sedeSeleccionada = sedes.find(s => s.id === formData.sede);
      const servicioSeleccionado = servicios.find(s => s.id === formData.servicio);
      const profesionalSeleccionado = profesionales.find(p => p.id === formData.profesional);

      // Validar que la fecha sea válida
      if (!isFechaValida(formData.fecha)) {
        showError("Error", "No se pueden agendar citas en fines de semana ni días festivos.");
        setSubmitting(false);
        return;
      }

      // Validar que la hora no esté ocupada (verificación final antes de crear)
      if (horasOcupadas.includes(formData.hora)) {
        showError("Error", "Esta hora ya está ocupada. Por favor, selecciona otra hora.");
        setSubmitting(false);
        return;
      }

      const nuevaCita = await createCita({
        user_id: user.id,
        sede_id: formData.sede,
        servicio_id: formData.servicio,
        servicio: servicioSeleccionado?.name || '',
        profesional_id: formData.profesional,
        profesional: profesionalSeleccionado?.name || '',
        fecha: formData.fecha,
        hora: formData.hora
      });

      // Enviar email de confirmación con enlaces interactivos
      try {
        await NotificationService.notifyCitaConfirmada(user.id, {
          servicio: servicioSeleccionado?.name || '',
          fecha: formData.fecha,
          hora: formData.hora,
          profesional: profesionalSeleccionado?.name || '',
          id: nuevaCita.id,
          confirmationToken: nuevaCita.confirmationToken,
          qr_code: nuevaCita.qr_code
        }, user.email);
      } catch (emailError) {
        console.error("Error enviando email:", emailError);
        // No fallar la creación de cita si el email falla
      }

      success("¡Cita reservada!", "Tu cita ha sido confirmada exitosamente y recibirás un email con más detalles");
      setTimeout(() => {
        router.push("/usuario/mis-citas");
      }, 1500);
    } catch (err: any) {
      console.error("Error completo al crear cita:", err);
      const errorMessage = err?.message || err?.details || JSON.stringify(err) || "No se pudo reservar la cita";
      showError("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.sede;
    if (step === 2) return formData.servicio;
    if (step === 3) return formData.profesional;
    if (step === 4) return formData.fecha && formData.hora;
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16A34A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`
                      h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-all
                      ${step >= s ? 'bg-[#16A34A] text-white' : 'bg-[#E5E7EB] text-[#6B7280]'}
                    `}>
                      {step > s ? <Check className="h-5 w-5" /> : s}
                    </div>
                    <p className="text-xs mt-2 text-[#6B7280] text-center hidden md:block">
                      {s === 1 ? 'Sede' : s === 2 ? 'Servicio' : s === 3 ? 'Profesional' : s === 4 ? 'Fecha' : 'Confirmar'}
                    </p>
                  </div>
                  {s < 5 && (
                    <div className={`
                      flex-1 h-1 mx-2 transition-all
                      ${step > s ? 'bg-[#16A34A]' : 'bg-[#E5E7EB]'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <Card className="border border-[#E5E7EB] shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {step === 1 && 'Selecciona la Sede'}
                {step === 2 && 'Elige un Servicio'}
                {step === 3 && 'Selecciona Doctor'}
                {step === 4 && 'Fecha y Hora'}
                {step === 5 && 'Confirma tu Cita'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Sede */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {sedes.map((sede) => (
                      <button
                        key={sede.id}
                        onClick={() => setFormData({ ...formData, sede: sede.id })}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all
                          ${formData.sede === sede.id 
                            ? 'border-[#16A34A] bg-[#F0FDF4]' 
                            : 'border-[#E5E7EB] hover:border-[#16A34A] hover:bg-[#F9FAFB]'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className={`h-5 w-5 ${formData.sede === sede.id ? 'text-[#16A34A]' : 'text-[#6B7280]'}`} />
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#111827] mb-1">{sede.name}</h3>
                            <p className="text-sm text-[#6B7280]">{sede.address}</p>
                            <p className="text-sm text-[#6B7280]">{sede.phone}</p>
                          </div>
                          {formData.sede === sede.id && (
                            <CheckCircle className="h-5 w-5 text-[#16A34A]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Servicio */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {servicios.filter(s => !formData.sede || s.sede_id === formData.sede).map((servicio) => (
                      <button
                        key={servicio.id}
                        onClick={() => setFormData({ ...formData, servicio: servicio.id })}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all
                          ${formData.servicio === servicio.id 
                            ? 'border-[#16A34A] bg-[#F0FDF4]' 
                            : 'border-[#E5E7EB] hover:border-[#16A34A] hover:bg-[#F9FAFB]'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#111827] mb-1">{servicio.name}</h3>
                            {servicio.description && (
                              <p className="text-sm text-[#6B7280]">{servicio.description}</p>
                            )}
                          </div>
                          {formData.servicio === servicio.id && (
                            <CheckCircle className="h-5 w-5 text-[#16A34A]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Doctor */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {profesionales.filter(p => {
                      const sedeMatch = !formData.sede || p.sede_id === formData.sede;
                      const servicioMatch = !formData.servicio || p.servicios?.includes(servicios.find(s => s.id === formData.servicio)?.name || '');
                      return sedeMatch && servicioMatch;
                    }).map((profesional) => (
                      <button
                        key={profesional.id}
                        onClick={() => setFormData({ ...formData, profesional: profesional.id })}
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all
                          ${formData.profesional === profesional.id 
                            ? 'border-[#16A34A] bg-[#F0FDF4]' 
                            : 'border-[#E5E7EB] hover:border-[#16A34A] hover:bg-[#F9FAFB]'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center text-white font-semibold">
                              {profesional.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-[#111827]">{profesional.name}</h3>
                              <p className="text-sm text-[#6B7280]">{profesional.email}</p>
                            </div>
                          </div>
                          {formData.profesional === profesional.id && (
                            <CheckCircle className="h-5 w-5 text-[#16A34A]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Fecha y Hora */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Selecciona la Fecha</Label>
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
                          <ArrowRight className="h-5 w-5" />
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
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-transparent bg-red-50 border-red-500 rounded"></div>
                        <span className="text-xs text-[#6B7280]">Festivo</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Selecciona la Hora</Label>
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
                </div>
              )}

              {/* Step 5: Confirmación */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-8 w-8 text-[#16A34A]" />
                      <h3 className="text-lg font-semibold text-[#111827]">Revisa tu Cita</h3>
                    </div>
                    
                    <div className="space-y-3 text-[#111827]">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#6B7280]" />
                        <span><strong>Sede:</strong> {sedes.find(s => s.id === formData.sede)?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#6B7280]" />
                        <span><strong>Servicio:</strong> {servicios.find(s => s.id === formData.servicio)?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#6B7280]" />
                        <span><strong>Doctor:</strong> {profesionales.find(p => p.id === formData.profesional)?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#6B7280]" />
                        <span><strong>Fecha y Hora:</strong> {new Date(formData.fecha).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric' 
                        })} a las {formData.hora}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      🎉 <strong>¡Casi listo!</strong> Al confirmar, recibirás un código QR y un recordatorio por email para tu cita.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                {step > 1 ? (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Atrás
                  </Button>
                ) : (
                  <div />
                )}
                
                {step < 5 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D]"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D]"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Confirmar Cita
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
