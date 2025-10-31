"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Ticket, 
  Clock,
  MapPin,
  User,
  Loader2,
  Info
} from "lucide-react";
import { useState, useEffect } from "react";
import { getColas, getServicios, getSedes, createTurno, getTurnos } from "@/lib/actions/database";
import { useToasts } from "@/lib/hooks/use-toast";

export default function TurnosPage() {
  const { success, error } = useToasts();
  const [colas, setColas] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sede: "",
    servicio: ""
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [colasData, serviciosData, sedesData] = await Promise.all([
          getColas(),
          getServicios(),
          getSedes()
        ]);
        setColas(colasData);
        setServicios(serviciosData);
        setSedes(sedesData);
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.sede || !formData.servicio) {
      error("Error", "Completa todos los campos requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const userStr = sessionStorage.getItem("user");
      if (!userStr) {
        error("Error", "No estás autenticado");
        return;
      }
      const user = JSON.parse(userStr);

      const servicioSeleccionado = servicios.find(s => s.id === formData.servicio);

      // Buscar una cola disponible para el servicio seleccionado
      const colasDisponibles = colas.filter(c => 
        c.servicio_id === formData.servicio && 
        c.is_active && 
        !c.is_cerrada
      );

      if (colasDisponibles.length === 0) {
        error("Error", "No hay colas disponibles para este servicio en este momento");
        setSubmitting(false);
        return;
      }

      // Seleccionar la cola con menos turnos actuales o la primera disponible
      const colaSeleccionada = colasDisponibles.reduce((prev, current) => 
        (prev.turnos_actuales || 0) < (current.turnos_actuales || 0) ? prev : current
      );

      // Obtener el próximo número de turno secuencial para la cola
      const turnosExistentes = await getTurnos({ estado: "en_espera" });
      const turnosEnCola = turnosExistentes.filter((t: any) => 
        t.cola_id === colaSeleccionada.id || t.cola === colaSeleccionada.name
      );
      const numeroTurno = turnosEnCola.length > 0 
        ? Math.max(...turnosEnCola.map((t: any) => t.numero || 0)) + 1 
        : 1;

      const nuevoTurno = await createTurno({
        user_id: user.id,
        sede_id: formData.sede,
        servicio_id: formData.servicio,
        servicio: servicioSeleccionado?.name || '',
        cola: colaSeleccionada.name,
        paciente: user.name || 'Usuario',
        numero: numeroTurno,
        tiempo_estimado: servicioSeleccionado?.duration || 15
      });

      // Mostrar confirmación con detalles del turno
      success("Éxito", `Turno #${numeroTurno} creado correctamente en cola ${colaSeleccionada.name}`);
      setFormData({ sede: "", servicio: "" });
      
      // Redirigir a tracking después de crear el turno
      setTimeout(() => {
        window.location.href = `/usuario/tracking?turno=${nuevoTurno.id}`;
      }, 1500);
    } catch (err: any) {
      console.error("Error creando turno:", err);
      error("Error", err.message || "No se pudo crear el turno");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">Turno Digital</h1>
            <p className="text-base text-gray-600">Toma tu turno y espera cómodamente</p>
          </div>

      {/* Formulario */}
      <Card className="border border-gray-200 bg-white shadow-lg">
        <CardHeader className="pb-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <CardTitle className="text-xl font-bold text-gray-900">Selecciona tu preferencia</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sede */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-700">
                  <MapPin className="h-4 w-4 inline mr-2 text-[#2563EB]" />
                  Sede
                </Label>
                <Select value={formData.sede} onValueChange={(value) => setFormData({ ...formData, sede: value, servicio: "" })}>
                  <SelectTrigger className="h-12 text-base border-2">
                    <SelectValue placeholder="Selecciona una sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedes.map((sede) => (
                      <SelectItem key={sede.id} value={sede.id} className="text-base py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#2563EB]" />
                          {sede.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Servicio */}
              {formData.sede && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold text-gray-700">
                    <Ticket className="h-4 w-4 inline mr-2 text-[#16A34A]" />
                    Servicio
                  </Label>
                  <Select value={formData.servicio} onValueChange={(value) => setFormData({ ...formData, servicio: value })}>
                    <SelectTrigger className="h-12 text-base border-2">
                      <SelectValue placeholder="Selecciona un servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicios.filter(s => s.sede_id === formData.sede || !s.sede_id).map((servicio) => (
                        <SelectItem key={servicio.id} value={servicio.id} className="text-base py-3">
                          {servicio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.servicio && (
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <Info className="h-4 w-4 inline mr-2 text-blue-600" />
                      Se asignará automáticamente a una cola disponible para este servicio
                    </p>
                  )}
                </div>
              )}

              {/* Botón de envío */}
              <Button
                onClick={handleSubmit}
                disabled={!formData.sede || !formData.servicio || submitting}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#2563EB] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#1E3A8A] shadow-lg transition-all duration-300"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Ticket className="h-5 w-5 mr-2" />
                    Tomar Turno
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border border-gray-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center shadow-md flex-shrink-0">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">¿Cómo funciona?</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Selecciona tu sede y servicio preferido</li>
                  <li>• Recibirás un número de turno único</li>
                  <li>• Te notificaremos cuando sea tu turno</li>
                  <li>• Puedes esperar cómodamente hasta que te llamen</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-gradient-to-br from-green-50 to-white shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#15803D] flex items-center justify-center shadow-md flex-shrink-0">
                <Ticket className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Ventajas</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Sin hacer fila física</li>
                  <li>• Tiempo estimado en tiempo real</li>
                  <li>• Notificaciones automáticas</li>
                  <li>• Puedes transferir a otra cola</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </div>
  );
}
