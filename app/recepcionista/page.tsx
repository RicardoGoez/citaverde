"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2,
  XCircle,
  Timer,
  Search
} from "lucide-react";
import { getCitas, getTurnos } from "@/lib/actions/database";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function RecepcionistaDashboard() {
  const [citas, setCitas] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'citas' | 'turnos'>('citas');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const citasData = await getCitas();
        const turnosData = await getTurnos();
        setCitas(citasData);
        setTurnos(turnosData);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calcular estadísticas
  const ahora = new Date();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  // Filtrar citas del día que aún no han pasado (fecha + hora)
  const citasHoy = citas.filter(c => {
    if (!c.fecha) return false;
    
    // Verificar que sea del día de hoy
    const fechaCita = new Date(c.fecha);
    fechaCita.setHours(0, 0, 0, 0);
    if (fechaCita.getTime() !== hoy.getTime()) return false;
    
    // Verificar que la hora aún no haya pasado (si tiene hora)
    if (c.hora) {
      const [horas, minutos] = c.hora.split(':').map(Number);
      const fechaHoraCita = new Date(c.fecha);
      fechaHoraCita.setHours(horas, minutos, 0, 0);
      
      // Si la hora ya pasó, no incluirla (a menos que esté en curso o completada)
      if (fechaHoraCita < ahora && c.estado !== 'en_curso' && c.estado !== 'completada') {
        return false;
      }
    }
    
    // Solo mostrar citas activas (no canceladas)
    return c.estado !== 'cancelada';
  });

  // Citas atendidas del día (solo las que ya pasaron o están completadas)
  const citasAtendidas = citasHoy.filter(c => c.estado === 'completada').length;
  
  // Citas pendientes del día (confirmadas o pendientes que aún no han pasado)
  const citasPendientes = citasHoy.filter(c => 
    (c.estado === 'pendiente' || c.estado === 'confirmada' || c.estado === 'en_curso')
  ).length;
  
  // Turnos activos del día (en espera o en atención) que no hayan pasado
  const turnosEnEspera = turnos.filter(t => {
    const estadoActivo = t.estado === 'en_espera' || t.estado === 'en_atencion';
    if (!estadoActivo) return false;
    
    // Verificar que sea del día de hoy
    if (t.fecha) {
      const fechaTurno = new Date(t.fecha);
      fechaTurno.setHours(0, 0, 0, 0);
      if (fechaTurno.getTime() !== hoy.getTime()) {
        return false; // No es del día de hoy
      }
    } else {
      // Si no tiene fecha, asumir que es del día de hoy (turnos sin fecha específica)
      // Pero mejor excluirlos si no tienen fecha para evitar confusión
      return false;
    }
    
    // Si tiene hora, verificar que no haya pasado
    if (t.hora) {
      const [horas, minutos] = t.hora.split(':').map(Number);
      const fechaHoraTurno = new Date(t.fecha);
      fechaHoraTurno.setHours(horas, minutos, 0, 0);
      
      // Si la hora ya pasó y no está en atención, no incluirlo
      if (fechaHoraTurno < ahora && t.estado !== 'en_atencion') {
        return false;
      }
    }
    
    return true;
  });
  
  // No presentados del día (solo de hoy)
  const noAsistieron = citasHoy.filter(c => c.no_show === true).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#111827]">Panel de Recepción</h1>
          <p className="text-gray-600 mt-1">Control en tiempo real del flujo de atención</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">En línea</span>
        </div>
      </div>

      {/* Acciones rápidas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/recepcionista/citas">
          <Button className="w-full h-24 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
            <Calendar className="mr-3 h-8 w-8" />
            <div className="text-left">
              <div className="text-lg">Nueva Cita</div>
              <div className="text-xs opacity-90">Crear cita manual</div>
            </div>
          </Button>
        </Link>
        <Link href="/recepcionista/turnos">
          <Button className="w-full h-24 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
            <Clock className="mr-3 h-8 w-8" />
            <div className="text-left">
              <div className="text-lg">Llamar Siguiente</div>
              <div className="text-xs opacity-90">Próximo turno</div>
            </div>
          </Button>
        </Link>
        <Link href="/recepcionista/mensajes">
          <Button className="w-full h-24 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
            <Clock className="mr-3 h-8 w-8" />
            <div className="text-left">
              <div className="text-lg">Enviar Mensaje</div>
              <div className="text-xs opacity-90">Avisos masivos</div>
            </div>
          </Button>
        </Link>
        <Button 
          onClick={() => setIsSearchOpen(true)}
          className="w-full h-24 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <Search className="mr-3 h-8 w-8" />
          <div className="text-left">
            <div className="text-lg">Buscar</div>
            <div className="text-xs opacity-90">Buscar registro</div>
          </div>
        </Button>
      </div>

      {/* Métricas grandes */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Citas del Día</p>
                <p className="text-4xl font-bold text-blue-700 mb-1">{citasHoy.length}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {citasAtendidas}
                  </Badge>
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                    <Clock className="h-3 w-3 mr-1" />
                    {citasPendientes}
                  </Badge>
                </div>
              </div>
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Turnos en Espera</p>
                <p className="text-4xl font-bold text-purple-700 mb-1">{turnosEnEspera.length}</p>
                <p className="text-xs text-purple-600 mt-1 font-medium">Activos ahora</p>
              </div>
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Tiempo Promedio</p>
                <p className="text-4xl font-bold text-orange-700 mb-1">6 min</p>
                <p className="text-xs text-orange-600 mt-1 font-medium">Por cita</p>
              </div>
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Timer className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">No Presentados</p>
                <p className="text-4xl font-bold text-red-700 mb-1">{noAsistieron}</p>
                <p className="text-xs text-red-600 mt-1 font-medium">Hoy</p>
              </div>
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <XCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button 
            onClick={() => setActiveTab('citas')}
            className={`py-2 px-1 font-semibold text-sm transition-colors ${
              activeTab === 'citas'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Citas ({citasHoy.length})
          </button>
          <button 
            onClick={() => setActiveTab('turnos')}
            className={`py-2 px-1 font-semibold text-sm transition-colors ${
              activeTab === 'turnos'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Turnos ({turnosEnEspera.length})
          </button>
        </nav>
      </div>

      {/* Citas del Día */}
      {activeTab === 'citas' && (
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">Citas del Día</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Gestiona las citas programadas para hoy</p>
          </CardHeader>
          <CardContent className="p-0">
            {citasHoy.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {citasHoy
                  .sort((a, b) => {
                    // Ordenar por hora (las más próximas primero)
                    if (a.hora && b.hora) {
                      return a.hora.localeCompare(b.hora);
                    }
                    return 0;
                  })
                  .map((cita) => (
                  <div key={cita.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                    <div>
                        <p className="font-semibold text-gray-900">{cita.paciente_name || cita.user_name || 'Sin nombre'}</p>
                        <p className="text-sm text-gray-600">{cita.hora || 'Sin hora'} • {cita.servicio || cita.servicio_name || 'Sin servicio'}</p>
                      </div>
                    </div>
                    <Badge className={
                      cita.estado === 'completada' ? 'bg-green-100 text-green-700 border-green-300' :
                      cita.estado === 'cancelada' ? 'bg-red-100 text-red-700 border-red-300' :
                      cita.estado === 'en_curso' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                      'bg-gray-100 text-gray-700 border-gray-300'
                    }>
                      {cita.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">No hay citas programadas</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Turnos del Día */}
      {activeTab === 'turnos' && (
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900">Turnos en Espera</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Visualiza los turnos activos del día</p>
          </CardHeader>
          <CardContent className="p-0">
            {turnosEnEspera.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {turnosEnEspera
                  .sort((a, b) => {
                    // Ordenar por número de turno (menor primero)
                    if (a.numero && b.numero) {
                      return a.numero - b.numero;
                    }
                    // Si no tienen número, ordenar por fecha/hora si tienen
                    if (a.fecha && b.fecha && a.hora && b.hora) {
                      const fechaA = new Date(`${a.fecha}T${a.hora}`);
                      const fechaB = new Date(`${b.fecha}T${b.hora}`);
                      return fechaA.getTime() - fechaB.getTime();
                    }
                    return 0;
                  })
                  .map((turno) => (
                  <div key={turno.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Turno #{turno.numero}</p>
                        <p className="text-sm text-gray-600">{turno.user_name || turno.paciente || 'Usuario'} • {turno.servicio || 'Servicio'}</p>
      </div>
                    </div>
                    <Badge className={
                      turno.estado === 'en_espera' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      turno.estado === 'en_atencion' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                      turno.estado === 'atendido' ? 'bg-green-100 text-green-700 border-green-300' :
                      turno.estado === 'no_presentado' ? 'bg-red-100 text-red-700 border-red-300' :
                      'bg-gray-100 text-gray-700 border-gray-300'
                    }>
                      {turno.estado === 'en_espera' ? 'En Espera' :
                       turno.estado === 'en_atencion' ? 'En Atención' :
                       turno.estado === 'atendido' ? 'Atendido' :
                       turno.estado === 'no_presentado' ? 'No Presentado' : turno.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">No hay turnos activos</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Búsqueda */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Buscar Registros</DialogTitle>
            <DialogDescription>
              Busca citas y turnos por nombre de paciente, servicio, fecha o ID
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, servicio, fecha o ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchQuery && (
              <div className="space-y-4">
                {/* Resultados de Citas */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-blue-600">Citas</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {citas
                      .filter(c => {
                        const query = searchQuery.toLowerCase();
                        const nombre = (c.paciente_name || c.user_name || '').toLowerCase();
                        const servicio = (c.servicio || c.servicio_name || '').toLowerCase();
                        const fecha = c.fecha || '';
                        const id = c.id?.toLowerCase() || '';
                        return nombre.includes(query) || servicio.includes(query) || fecha.includes(query) || id.includes(query);
                      })
                      .slice(0, 10)
                      .map((cita) => (
                        <Card key={cita.id} className="p-3 hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{cita.paciente_name || cita.user_name || 'Sin nombre'}</p>
                              <p className="text-sm text-gray-600">
                                {cita.fecha} {cita.hora} • {cita.servicio || cita.servicio_name || 'Sin servicio'}
                              </p>
                            </div>
                            <Badge className={
                              cita.estado === 'completada' ? 'bg-green-100 text-green-700' :
                              cita.estado === 'cancelada' ? 'bg-red-100 text-red-700' :
                              cita.estado === 'en_curso' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {cita.estado}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    {citas.filter(c => {
                      const query = searchQuery.toLowerCase();
                      const nombre = (c.paciente_name || c.user_name || '').toLowerCase();
                      const servicio = (c.servicio || c.servicio_name || '').toLowerCase();
                      const fecha = c.fecha || '';
                      const id = c.id?.toLowerCase() || '';
                      return nombre.includes(query) || servicio.includes(query) || fecha.includes(query) || id.includes(query);
                    }).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No se encontraron citas</p>
                    )}
                  </div>
                </div>

                {/* Resultados de Turnos */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-purple-600">Turnos</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {turnos
                      .filter(t => {
                        const query = searchQuery.toLowerCase();
                        const nombre = (t.user_name || t.paciente || '').toLowerCase();
                        const servicio = (t.servicio || '').toLowerCase();
                        const numero = t.numero?.toString() || '';
                        const id = t.id?.toLowerCase() || '';
                        return nombre.includes(query) || servicio.includes(query) || numero.includes(query) || id.includes(query);
                      })
                      .slice(0, 10)
                      .map((turno) => (
                        <Card key={turno.id} className="p-3 hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">Turno #{turno.numero}</p>
                              <p className="text-sm text-gray-600">
                                {turno.user_name || turno.paciente || 'Usuario'} • {turno.servicio || 'Servicio'}
                                {turno.fecha && ` • ${turno.fecha} ${turno.hora || ''}`}
                              </p>
                            </div>
                            <Badge className={
                              turno.estado === 'en_espera' ? 'bg-yellow-100 text-yellow-700' :
                              turno.estado === 'en_atencion' ? 'bg-blue-100 text-blue-700' :
                              turno.estado === 'atendido' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {turno.estado === 'en_espera' ? 'En Espera' :
                               turno.estado === 'en_atencion' ? 'En Atención' :
                               turno.estado === 'atendido' ? 'Atendido' : turno.estado}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    {turnos.filter(t => {
                      const query = searchQuery.toLowerCase();
                      const nombre = (t.user_name || t.paciente || '').toLowerCase();
                      const servicio = (t.servicio || '').toLowerCase();
                      const numero = t.numero?.toString() || '';
                      const id = t.id?.toLowerCase() || '';
                      return nombre.includes(query) || servicio.includes(query) || numero.includes(query) || id.includes(query);
                    }).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No se encontraron turnos</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Ingresa un término de búsqueda para encontrar citas y turnos</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
