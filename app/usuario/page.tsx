"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Ticket, 
  Clock,
  QrCode,
  MapPin,
  User,
  Plus,
  ScanLine
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getCitas, getTurnos } from "@/lib/actions/database";

export default function UsuarioDashboard() {
  const [citas, setCitas] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Usuario");
  const [activeTab, setActiveTab] = useState<'citas' | 'turnos'>('citas');

  useEffect(() => {
    const loadData = async () => {
      try {
        const userStr = sessionStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.name || "Usuario");
          const [citasData, turnosData] = await Promise.all([
            getCitas({ userId: user.id }),
            getTurnos({ userId: user.id })
          ]);
          setCitas(citasData);
          setTurnos(turnosData);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const proximasCitas = citas.filter(c => {
    const fecha = new Date(c.fecha);
    return fecha >= new Date() && c.estado !== 'completada' && c.estado !== 'cancelada';
  }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const turnosActivos = turnos.filter(t => 
    t.estado === 'en_espera' || t.estado === 'en_atencion'
  ).sort((a, b) => (a.numero || 0) - (b.numero || 0));

  const proximaCita = proximasCitas[0];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Saludo personalizado */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">Hola, {userName.split(' ')[0]}</h1>
            <p className="text-base text-gray-600">Gestiona tus citas y turnos médicos</p>
          </div>

          {/* Acciones principales - 3 tarjetas compactas responsive */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Nueva Cita */}
            <Link href="/usuario/reservar" className="block">
              <Card className="border border-gray-200 bg-white hover:border-[#16A34A] transition-all cursor-pointer h-full">
                <CardContent className="p-2 sm:p-4">
                  <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#16A34A]/10 flex items-center justify-center">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-[#16A34A]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Nueva Cita</h3>
                      <p className="text-xs text-gray-600 mt-0.5 hidden sm:block">Reserva una cita médica</p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-[#16A34A] font-medium">Toca para reservar</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Turno Digital */}
            <Link href="/usuario/turnos" className="block">
              <Card className="border border-gray-200 bg-white hover:border-[#2563EB] transition-all cursor-pointer h-full">
                <CardContent className="p-2 sm:p-4">
                  <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#2563EB]/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#2563EB]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Turno Digital</h3>
                      <p className="text-xs text-gray-600 mt-0.5 hidden sm:block">Solicita un turno sin cita</p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-[#2563EB] font-medium">Toca para solicitar</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Escanear QR */}
            <Link href="/usuario/qr" className="block">
              <Card className="border border-gray-200 bg-white hover:border-[#7C3AED] transition-all cursor-pointer h-full">
                <CardContent className="p-2 sm:p-4">
                  <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#7C3AED]/10 flex items-center justify-center">
                      <ScanLine className="h-4 w-4 sm:h-5 sm:w-5 text-[#7C3AED]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">Escanear QR</h3>
                      <p className="text-xs text-gray-600 mt-0.5 hidden sm:block">Escanea códigos QR para check-in</p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-[#7C3AED] font-medium">Toca para escanear</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Selector de pestañas */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('citas')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                activeTab === 'citas'
                  ? 'border-[#16A34A] bg-[#16A34A]/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Calendar className={`h-5 w-5 transition-colors duration-200 ${activeTab === 'citas' ? 'text-[#16A34A]' : 'text-gray-500'}`} />
              <span className={`font-semibold transition-colors duration-200 ${activeTab === 'citas' ? 'text-[#16A34A]' : 'text-gray-700'}`}>
                Citas
              </span>
              <Badge className="bg-gray-400 text-white text-xs px-1.5 py-0">{proximasCitas.length}</Badge>
            </button>
            <button
              onClick={() => setActiveTab('turnos')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                activeTab === 'turnos'
                  ? 'border-[#2563EB] bg-[#2563EB]/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Clock className={`h-5 w-5 transition-colors duration-200 ${activeTab === 'turnos' ? 'text-[#2563EB]' : 'text-gray-500'}`} />
              <span className={`font-semibold transition-colors duration-200 ${activeTab === 'turnos' ? 'text-[#2563EB]' : 'text-gray-700'}`}>
                Turnos
              </span>
              <Badge className="bg-gray-400 text-white text-xs px-1.5 py-0">{turnosActivos.length}</Badge>
            </button>
          </div>

          {/* Contenido con transiciones suaves */}
          <div className="relative min-h-[400px]">
            {/* Contenido de Citas */}
            <div 
              className={`transition-all duration-300 ease-in-out space-y-3 ${
                activeTab === 'citas' 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 absolute inset-0 -translate-x-4 pointer-events-none'
              }`}
            >
              {/* Próxima Cita destacada */}
              {proximaCita && (
                <Card className="border border-gray-300 bg-gradient-to-br from-green-50 to-white shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-[#16A34A] flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg font-bold text-gray-900">Próxima Cita</CardTitle>
                    </div>
                    <Badge className="bg-green-600 text-white border-0 px-3 py-1">
                      {proximaCita.estado}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-6 w-6 text-[#16A34A]" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-bold text-gray-900 text-lg">{proximaCita.servicio || 'Servicio'}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(proximaCita.fecha).toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {proximaCita.hora}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            CitaVerde {proximaCita.sede || 'Centro'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {proximaCita.qr_code && (
                        <Button className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white" size="sm">
                          <QrCode className="h-4 w-4 mr-2" />
                          Ver Código QR
                        </Button>
                      )}
                      <Button variant="outline" className="flex-1 border-2 border-gray-300" size="sm">
                        Ver Todas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de citas */}
              <div className="space-y-3">
                {(proximasCitas.slice(1, 5)).map((cita) => (
                  <Card key={cita.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-[#16A34A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1">{cita.servicio || 'Servicio'}</h4>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(cita.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {cita.hora}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {cita.sede || 'Centro'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className="bg-gray-600 text-white text-xs">{cita.estado}</Badge>
                          {cita.qr_code && (
                            <Button variant="outline" size="sm" className="h-7 text-xs border-gray-300">
                              Ver QR
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Contenido de Turnos */}
            <div 
              className={`transition-all duration-300 ease-in-out ${
                activeTab === 'turnos' 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 absolute inset-0 translate-x-4 pointer-events-none'
              }`}
            >
              {turnosActivos.length > 0 ? (
                <div className="space-y-3">
                  {turnosActivos.map((turno) => (
                    <Card key={turno.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-[#2563EB]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-bold text-[#2563EB]">#{turno.numero}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 mb-1">{turno.servicio || 'Servicio'}</h4>
                            <p className="text-sm text-gray-600">{turno.cola || 'General'}</p>
                          </div>
                          <Badge className={
                            turno.estado === 'en_atencion' 
                              ? 'bg-[#2563EB] text-white' 
                              : 'bg-gray-600 text-white'
                          }>
                            {turno.estado === 'en_espera' ? 'En Espera' : 'En Atención'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border border-gray-200 bg-white">
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No tienes turnos activos</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
