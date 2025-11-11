"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Clock,
  Search,
  Edit,
  X,
  QrCode,
  MapPin,
  Star,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getCitas, updateCita, getProfesionales, getSedes, regenerateQRCita } from "@/lib/actions/database";
import Link from "next/link";
import { useToasts } from "@/lib/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function MisCitasPage() {
  const { success, error: showError } = useToasts();
  const [citas, setCitas] = useState<any[]>([]);
  const [filteredCitas, setFilteredCitas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Función helper para formatear fecha desde string YYYY-MM-DD en hora local
  const formatearFechaLocal = (fechaStr: string, opciones?: Intl.DateTimeFormatOptions): string => {
    if (!fechaStr) return '';
    // Crear fecha desde string en hora local (evitar problemas de zona horaria)
    const [año, mes, dia] = fechaStr.split('-').map(Number);
    const fecha = new Date(año, mes - 1, dia); // mes - 1 porque Date usa meses 0-11
    return fecha.toLocaleDateString('es-ES', opciones || { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric' 
    });
  };
  const [loading, setLoading] = useState(true);
  const [isReprogramarOpen, setIsReprogramarOpen] = useState(false);
  const [citaAReprogramar, setCitaAReprogramar] = useState<any>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("");
  const [isEvaluarOpen, setIsEvaluarOpen] = useState(false);
  const [citaAEvaluar, setCitaAEvaluar] = useState<any>(null);
  const [calificacion, setCalificacion] = useState(0);

  useEffect(() => {
    const loadCitas = async () => {
      try {
        const userStr = sessionStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          const citasData = await getCitas({ userId: userData.id });
          setCitas(citasData);
          setFilteredCitas(citasData);
        }
      } catch (error) {
        console.error("Error cargando citas:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCitas();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadCitas, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filtered = citas.filter(cita =>
      cita.servicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cita.profesional?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCitas(filtered);
  }, [searchTerm, citas]);

  const handleReprogramar = async (citaId: string) => {
    const cita = citas.find(c => c.id === citaId);
    if (!cita) return;
    
    setCitaAReprogramar(cita);
    setNuevaFecha("");
    setNuevaHora("");
    setIsReprogramarOpen(true);
  };

  const handleGuardarReprogramacion = async () => {
    if (!nuevaFecha || !nuevaHora) {
      showError("Error", "Selecciona una nueva fecha y hora");
      return;
    }

    try {
      await updateCita(citaAReprogramar.id, {
        fecha: nuevaFecha,
        hora: nuevaHora,
        updated_at: new Date().toISOString()
      });
      
      success("Cita reprogramada", "Tu cita ha sido reprogramada exitosamente");
      setIsReprogramarOpen(false);
      
      // Recargar citas
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        const citasData = await getCitas({ userId: userData.id });
        setCitas(citasData);
        setFilteredCitas(citasData);
      }
    } catch (err: any) {
      showError("Error", err.message || "No se pudo reprogramar la cita");
    }
  };

  const handleEvaluar = (cita: any) => {
    setCitaAEvaluar(cita);
    setCalificacion(0);
    setIsEvaluarOpen(true);
  };

  const handleGuardarCalificacion = async () => {
    if (calificacion === 0) {
      showError("Error", "Selecciona una calificación");
      return;
    }

    try {
      await updateCita(citaAEvaluar.id, {
        evaluacion: calificacion,
        updated_at: new Date().toISOString()
      });
      
      success("Calificación enviada", "Gracias por tu retroalimentación");
      setIsEvaluarOpen(false);
      
      // Recargar citas
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        const citasData = await getCitas({ userId: userData.id });
        setCitas(citasData);
        setFilteredCitas(citasData);
      }
    } catch (err: any) {
      showError("Error", err.message || "No se pudo enviar la calificación");
    }
  };

  const handleCancelar = async (citaId: string) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;

    try {
      await updateCita(citaId, { estado: "cancelada" });
      
      // Recargar citas
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        const citasData = await getCitas({ userId: userData.id });
        setCitas(citasData);
        setFilteredCitas(citasData);
      }
      
      success("Cita cancelada", "Tu cita ha sido cancelada exitosamente");
    } catch (err: any) {
      showError("Error", err.message || "No se pudo cancelar la cita");
    }
  };

  const handleReemitirQR = async (citaId: string) => {
    if (!confirm("¿Estás seguro de que deseas reemitir el código QR? El código anterior quedará invalidado.")) return;

    try {
      await regenerateQRCita(citaId);
      
      // Recargar citas
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        const citasData = await getCitas({ userId: userData.id });
        setCitas(citasData);
        setFilteredCitas(citasData);
      }
      
      success("QR reemitido", "Se ha generado un nuevo código QR exitosamente");
    } catch (err: any) {
      showError("Error", err.message || "No se pudo reemitir el código QR");
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      confirmada: { className: "bg-green-600 text-white", label: "Confirmada" },
      pendiente: { className: "bg-yellow-500 text-white", label: "Pendiente" },
      completada: { className: "bg-blue-600 text-white", label: "Completada" },
      cancelada: { className: "bg-red-600 text-white", label: "Cancelada" },
    };
    const config = variants[estado] || { className: "bg-gray-600 text-white", label: estado };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const citasPendientes = filteredCitas.filter(c => 
    c.estado === "confirmada" || c.estado === "pendiente"
  );
  const citasPasadas = filteredCitas.filter(c => 
    c.estado === "completada" || c.estado === "cancelada"
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16A34A]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Citas</h1>
              <p className="text-base text-gray-600">Gestiona todas tus citas programadas</p>
            </div>
            <Button className="bg-[#16A34A] hover:bg-[#15803D]" asChild>
              <Link href="/usuario/reservar">
                Nueva Cita
              </Link>
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por servicio o doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Próximas Citas */}
          {citasPendientes.length > 0 && (
            <Card className="border border-gray-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Próximas Citas</CardTitle>
                <CardDescription className="text-gray-600">Tus citas confirmadas y pendientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {citasPendientes.map((cita: any) => (
                    <div
                      key={cita.id}
                      className="p-5 rounded-xl bg-gray-50 border border-gray-200 space-y-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-[#16A34A] flex items-center justify-center text-white">
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{cita.servicio}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Calendar className="h-4 w-4" />
                              {formatearFechaLocal(cita.fecha, { weekday: 'long', day: 'numeric', month: 'long' })} a las {cita.hora}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              {cita.profesional}
                            </div>
                          </div>
                        </div>
                        {getEstadoBadge(cita.estado)}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {cita.qr_code && cita.estado !== "cancelada" && (
                          <>
                            <Button size="sm" variant="outline" className="border-[#16A34A] text-[#16A34A] hover:bg-[#16A34A] hover:text-white" asChild>
                              <Link href={`/usuario/qr?cita=${cita.id}`}>
                                <QrCode className="mr-2 h-4 w-4" />
                                Ver QR
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              onClick={() => handleReemitirQR(cita.id)}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Reemitir QR
                            </Button>
                          </>
                        )}
                        {cita.estado !== "cancelada" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300"
                              onClick={() => handleReprogramar(cita.id)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Reprogramar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleCancelar(cita.id)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial */}
          {citasPasadas.length > 0 && (
            <Card className="border border-gray-200 bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Historial de Citas</CardTitle>
                <CardDescription className="text-gray-600">Tus citas anteriores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {citasPasadas.map((cita: any) => (
                    <div
                      key={cita.id}
                      className="p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{cita.servicio}</h3>
                            <p className="text-sm text-gray-600">
                              {formatearFechaLocal(cita.fecha)} a las {cita.hora}
                            </p>
                            <p className="text-sm text-gray-600">
                              {cita.profesional}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                        {getEstadoBadge(cita.estado)}
                          {cita.estado === "completada" && !cita.evaluacion && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                              onClick={() => handleEvaluar(cita)}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Calificar
                            </Button>
                          )}
                          {cita.evaluacion && (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= cita.evaluacion ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado vacío */}
          {filteredCitas.length === 0 && (
            <Card className="border border-gray-200 bg-white shadow-lg">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No tienes citas</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Reserva tu primera cita ahora
                </p>
                <Button className="bg-[#16A34A] hover:bg-[#15803D]" asChild>
                  <Link href="/usuario/reservar">Reservar Cita</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Reprogramación */}
      <Dialog open={isReprogramarOpen} onOpenChange={setIsReprogramarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar Cita</DialogTitle>
            <DialogDescription>
              Selecciona una nueva fecha y hora para tu cita
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Cita Actual</h4>
              <p className="text-sm text-blue-700">
                📅 {citaAReprogramar?.fecha && formatearFechaLocal(citaAReprogramar.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-sm text-blue-700">
                🕐 {citaAReprogramar?.hora}
              </p>
            </div>
            <div>
              <Label>Nueva Fecha *</Label>
              <Input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Nueva Hora *</Label>
              <Select value={nuevaHora} onValueChange={setNuevaHora}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una hora" />
                </SelectTrigger>
                <SelectContent>
                  {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
                    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map(hora => (
                    <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReprogramarOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarReprogramacion} className="bg-[#16A34A] hover:bg-[#15803D]">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Evaluación */}
      <Dialog open={isEvaluarOpen} onOpenChange={setIsEvaluarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calificar Atención</DialogTitle>
            <DialogDescription>
              ¿Cómo fue tu experiencia en esta cita?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {citaAEvaluar && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="font-semibold">{citaAEvaluar.servicio}</p>
                <p className="text-sm text-gray-600">{formatearFechaLocal(citaAEvaluar.fecha)} a las {citaAEvaluar.hora}</p>
              </div>
            )}
            <div>
              <Label>Calificación *</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCalificacion(star)}
                    className={`transition-all ${
                      calificacion >= star ? 'text-yellow-500' : 'text-gray-300'
                    } hover:text-yellow-500`}
                  >
                    <Star className="h-8 w-8 fill-current" />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {calificacion > 0 && (
                  <>
                    {calificacion === 5 && "⭐ Excelente - Muy satisfecho"}
                    {calificacion === 4 && "👍 Muy bien - Satisfecho"}
                    {calificacion === 3 && "👍 Bien - Aceptable"}
                    {calificacion === 2 && "👎 Regular - Podría mejorar"}
                    {calificacion === 1 && "👎 Malo - Muy insatisfecho"}
                  </>
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEvaluarOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarCalificacion} className="bg-[#16A34A] hover:bg-[#15803D]" disabled={calificacion === 0}>
              Enviar Calificación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
