"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2,
  XCircle,
  Timer
} from "lucide-react";
import { getCitas, getTurnos } from "@/lib/actions/database";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function RecepcionistaDashboard() {
  const [citas, setCitas] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'citas' | 'turnos'>('citas');

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
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const citasHoy = citas.filter(c => {
    if (!c.fecha) return false;
    const fecha = new Date(c.fecha);
    return fecha >= hoy && fecha < new Date(hoy.getTime() + 24 * 60 * 60 * 1000);
  });

  const citasAtendidas = citas.filter(c => c.estado === 'completada').length;
  const citasPendientes = citas.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length;
  const turnosEnEspera = turnos.filter(t => t.estado === 'en_espera' || t.estado === 'en_atencion');
  const turnosActivos = turnosEnEspera.slice(0, 4);
  const noAsistieron = citas.filter(c => c.no_show === true).length;

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
        <Button className="w-full h-24 bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
          <Calendar className="mr-3 h-8 w-8" />
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
            {citasHoy.slice(0, 4).length > 0 ? (
              <div className="divide-y divide-gray-200">
                {citasHoy.slice(0, 4).map((cita) => (
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
            {turnosActivos.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {turnosActivos.map((turno) => (
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
    </div>
  );
}
