"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  MessageSquare,
  Clock,
  Users,
  Ticket
} from "lucide-react";
import { getTurnos, getColas, updateTurno } from "@/lib/actions/database";
import { getUserById } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notifications";
import { useState, useEffect } from "react";
import { useToasts } from "@/lib/hooks/use-toast";
import { useSede } from "@/lib/hooks/use-sede";

export default function TurnosRecepcionista() {
  const [turnos, setTurnos] = useState<any[]>([]);
  const [colas, setColas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError, info } = useToasts();
  const [colaSeleccionada, setColaSeleccionada] = useState<string | null>(null);
  const { sedeSeleccionada } = useSede();

  useEffect(() => {
    const loadData = async () => {
      if (!sedeSeleccionada) {
        setLoading(false);
        return;
      }

      try {
        const turnosData = await getTurnos();
        const colasData = await getColas();
        
        // Filtrar turnos y colas por sede
        const turnosFiltrados = turnosData.filter((t: any) => t.sede_id === sedeSeleccionada.id);
        const colasFiltradas = colasData.filter((c: any) => c.sede_id === sedeSeleccionada.id);
        
        setTurnos(turnosFiltrados);
        setColas(colasFiltradas);
      } catch (err) {
        console.error("Error cargando datos:", err);
        showError("Error", "Error cargando turnos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Actualizar cada 5 segundos
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [sedeSeleccionada]);

  // Filtrar colas que tienen turnos activos
  const colasConTurnos = colas.filter(cola => {
    const turnosEnEstaCola = turnos.filter(t => 
      t.cola_id === cola.id || t.cola === cola.name || t.cola === cola.nombre
    );
    return turnosEnEstaCola.some(t => t.estado === 'en_espera' || t.estado === 'en_atencion');
  });

  // Seleccionar automáticamente la primera cola con turnos
  useEffect(() => {
    if (colasConTurnos.length > 0 && !colaSeleccionada) {
      setColaSeleccionada(colasConTurnos[0].id);
    }
  }, [colasConTurnos.length]);

  const colaActual = colas.find(c => c.id === colaSeleccionada);
  const turnosEnCola = turnos.filter(t => t.cola_id === colaSeleccionada || t.cola === colaActual?.name || t.cola === colaActual?.nombre);
  const turnosEnEspera = turnosEnCola.filter(t => t.estado === 'en_espera');
  const turnosEnAtencion = turnosEnCola.filter(t => t.estado === 'en_atencion');

  const handleLlamarSiguiente = async () => {
    if (turnosEnEspera.length > 0) {
      const siguiente = turnosEnEspera[0];
      try {
        // Actualizar estado del turno
        await updateTurno(siguiente.id, { estado: 'en_atencion' });
        success("Llamando turno", `Turno #${siguiente.numero}`);
        
        // Notificar al usuario que es su turno
        try {
          const user = await getUserById(siguiente.user_id);
          if (user && user.email) {
            await NotificationService.notifyTurnoListo(
              siguiente.user_id,
              {
                numero: siguiente.numero,
                servicio: siguiente.servicio || 'Servicio',
                cola: siguiente.cola || colaActual?.name || colaActual?.nombre
              },
              user.email
            );
            console.log(`✅ Notificación enviada a ${user.email} para turno #${siguiente.numero}`);
          }
        } catch (notifError) {
          console.error("Error enviando notificación:", notifError);
          // No fallar si la notificación falla
        }
        
        // Notificar a los siguientes en la cola si faltan pocos turnos
        try {
          const proximos = turnosEnEspera.slice(1, 4); // Próximos 3 usuarios
          for (const proximo of proximos) {
            const index = turnosEnEspera.indexOf(proximo);
            const user = await getUserById(proximo.user_id);
            if (user && user.email && index < 3) {
              await NotificationService.notifyTurnosFaltantes(
                proximo.user_id,
                {
                  numero: proximo.numero,
                  turnosAntes: index,
                  servicio: proximo.servicio || 'Servicio'
                },
                user.email
              );
            }
          }
        } catch (notifError) {
          console.error("Error enviando notificaciones anticipadas:", notifError);
        }
        
        // Recargar datos
        const turnosData = await getTurnos();
        const turnosFiltrados = turnosData.filter((t: any) => t.sede_id === sedeSeleccionada?.id);
        setTurnos(turnosFiltrados);
      } catch (err: any) {
        showError("Error", err.message || "No se pudo actualizar el turno");
      }
    } else {
      info("Aviso", "No hay turnos en espera");
    }
  };

  const calcularTiempoEspera = (turno: any) => {
    if (!turno.created_at) return "00:00";
    const ahora = new Date();
    const creado = new Date(turno.created_at);
    const diff = Math.floor((ahora.getTime() - creado.getTime()) / 1000 / 60);
    return `${String(Math.floor(diff / 60)).padStart(2, '0')}:${String(diff % 60).padStart(2, '0')}`;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'en_atencion':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'atendido':
      case 'completado':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'no_presentado':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Turnos</h1>
          <p className="text-gray-600 mt-1">Administra los turnos digitales en tiempo real</p>
        </div>
      </div>

      {/* Selector de colas y información */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1 w-full bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white p-4 md:p-6 rounded-xl shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl md:text-3xl font-bold">{colaActual?.nombre || colaActual?.name || 'Selecciona una cola'}</h2>
              <div className="flex flex-wrap gap-3 md:gap-4 mt-3 md:mt-4">
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold">{turnosEnEspera.length} en espera</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-semibold">{turnosEnAtencion.length} en atención</span>
                </div>
              </div>
            </div>
            <Badge className="bg-white text-purple-700 px-4 py-2 md:px-6 md:py-3 text-lg md:text-2xl font-bold shadow-lg">
              {turnosEnEspera.length + turnosEnAtencion.length} Total
            </Badge>
          </div>
        </div>
        
        {/* Selector de colas con turnos activos */}
        {colasConTurnos.length > 1 && (
          <Card className="border-2 border-gray-200 shadow-md w-full md:min-w-[220px] bg-white">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="text-sm font-bold text-gray-900 uppercase tracking-wide">Otras Colas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
                {colasConTurnos.map((cola) => (
                <Button
                  key={cola.id}
                  variant={colaSeleccionada === cola.id ? "default" : "outline"}
                  className={`w-full justify-start h-12 transition-all ${
                    colaSeleccionada === cola.id 
                      ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md" 
                      : "hover:bg-purple-50 hover:border-purple-300"
                  }`}
                  onClick={() => setColaSeleccionada(cola.id)}
                >
                  {cola.nombre || cola.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Botones de acción principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <Button 
          onClick={handleLlamarSiguiente}
          className="h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-sm shadow-lg hover:scale-105 transition-transform"
          disabled={turnosEnEspera.length === 0}
        >
          <div className="flex flex-col items-center gap-1">
            <Play className="h-6 w-6" />
            <span className="text-xs">Llamar Siguiente</span>
          </div>
        </Button>
        
        <Button 
          variant="outline"
          className="h-16 border-2 border-purple-300 hover:border-purple-400 hover:bg-purple-50 font-semibold text-sm shadow-md hover:scale-105 transition-transform"
          onClick={() => window.location.href = '/recepcionista/mensajes'}
        >
          <div className="flex flex-col items-center gap-1">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            <span className="text-xs text-purple-700">Aviso Masivo</span>
          </div>
        </Button>
      </div>

      {/* Tabla de turnos */}
      <Card className="border-2 border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
          <CardTitle className="text-xl font-bold text-gray-900">Turnos en Cola</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Usuario</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Espera</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {turnosEnCola.length > 0 ? (
                  turnosEnCola.map((turno) => (
                    <tr 
                      key={turno.id} 
                      className={`transition-all duration-200 ${
                        turno.estado === 'en_atencion' 
                          ? 'bg-gradient-to-r from-blue-50 to-transparent hover:from-blue-100' 
                          : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent'
                      }`}
                    >
                      <td className="py-5 px-6">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
                          turno.estado === 'en_atencion' 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white animate-pulse' 
                            : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                        }`}>
                          {turno.numero}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-md">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                        <div>
                            <p className="font-semibold text-gray-900">{turno.user_name || turno.paciente || 'Usuario'}</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              {turno.servicio || 'Servicio'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <Badge 
                          variant="outline" 
                          className={`${getEstadoColor(turno.estado)} border-2 font-semibold`}
                        >
                          {turno.estado === 'en_espera' ? 'En Espera' :
                           turno.estado === 'en_atencion' ? 'En Atención' :
                           turno.estado === 'atendido' || turno.estado === 'completado' ? 'Atendido' :
                           turno.estado === 'no_presentado' ? 'No Presentado' : turno.estado}
                        </Badge>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Clock className="h-4 w-4" />
                          {calcularTiempoEspera(turno)}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex justify-end gap-2">
                          {turno.estado === 'en_espera' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleLlamarSiguiente()}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
                            >
                              Llamar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Ticket className="h-16 w-16 text-gray-300" />
                        <p className="text-gray-500 font-medium text-lg">No hay turnos en esta cola</p>
                        <p className="text-gray-400 text-sm">Los turnos aparecerán aquí cuando sean solicitados</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
