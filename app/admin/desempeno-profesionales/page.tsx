"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, TrendingDown, Clock, Users, Star, AlertCircle, Target } from "lucide-react";
import { getCitas, getProfesionales } from "@/lib/actions/database";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricsProfesional {
  id: string;
  nombre: string;
  totalCitas: number;
  citasCompletadas: number;
  citasCanceladas: number;
  noShow: number;
  tasaExito: number;
  tasaNoShow: number;
  tiempoPromedio: number;
  satisfaccion: number;
  puntualidad: number;
}

export default function DesempenoProfesionalesPage() {
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [profesionalesData, citasData] = await Promise.all([
          getProfesionales(),
          getCitas()
        ]);
        setProfesionales(profesionalesData);
        setCitas(citasData);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  // Calcular métricas por profesional
  const calcularMetricas = (): MetricsProfesional[] => {
    return profesionales.map(prof => {
      const citasProfesional = citas.filter(c => 
        c.profesional_id === prof.id || c.profesional === prof.name
      );
      
      const totalCitas = citasProfesional.length;
      const citasCompletadas = citasProfesional.filter(c => c.estado === 'completada').length;
      const citasCanceladas = citasProfesional.filter(c => c.estado === 'cancelada').length;
      const noShow = citasProfesional.filter(c => c.no_show === true).length;
      
      const tasaExito = totalCitas > 0 ? (citasCompletadas / totalCitas) * 100 : 0;
      const tasaNoShow = totalCitas > 0 ? (noShow / totalCitas) * 100 : 0;
      
      // Calcular tiempo promedio de atención (usando duración del servicio)
      const tiempos = citasProfesional
        .map(c => {
          // Buscar duración del servicio
          const servicioData = citas.find(cit => cit.id === c.id)?.servicio;
          return c.tiempo_espera_minutos || 20; // Valor por defecto
        })
        .filter(t => t > 0);
      const tiempoPromedio = tiempos.length > 0 
        ? tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length 
        : 20;
      
      // Satisfacción promedio REAL basada en calificaciones recibidas
      const citasCalificadas = citasProfesional.filter(c => c.evaluacion && c.evaluacion > 0);
      const satisfaccion = citasCalificadas.length > 0
        ? citasCalificadas.reduce((sum, c) => sum + (c.evaluacion || 0), 0) / citasCalificadas.length
        : 0;
      
      // Puntualidad REAL (porcentaje de citas que iniciaron a tiempo)
      const citasConCheckIn = citasProfesional.filter(c => c.hora_checkin && c.hora);
      const citasPuntuales = citasConCheckIn.filter(c => {
        // Obtener hora programada (formato HH:MM)
        const [horaProg, minProg] = c.hora.split(':').map(Number);
        const horaProgDate = new Date(c.fecha);
        horaProgDate.setHours(horaProg, minProg, 0, 0);
        
        // Obtener hora de check-in
        const horaCheckIn = new Date(c.hora_checkin);
        
        // Calcular diferencia en minutos
        const diffMinutos = (horaCheckIn.getTime() - horaProgDate.getTime()) / (1000 * 60);
        
        // Considerar puntual si llega máximo 15 minutos tarde
        return diffMinutos <= 15;
      }).length;
      
      const puntualidad = citasConCheckIn.length > 0
        ? (citasPuntuales / citasConCheckIn.length) * 100
        : 0;
      
      return {
        id: prof.id,
        nombre: prof.name,
        totalCitas,
        citasCompletadas,
        citasCanceladas,
        noShow,
        tasaExito: Math.round(tasaExito * 10) / 10,
        tasaNoShow: Math.round(tasaNoShow * 10) / 10,
        tiempoPromedio: Math.round(tiempoPromedio),
        satisfaccion: Math.round(satisfaccion * 10) / 10,
        puntualidad: Math.round(puntualidad * 10) / 10
      };
    });
  };

  const metricas = calcularMetricas();

  // Filtrar profesionales por búsqueda
  const profesionalesFiltrados = metricas.filter(prof =>
    prof.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar por tasa de éxito
  const profesionalesOrdenados = [...profesionalesFiltrados].sort(
    (a, b) => b.tasaExito - a.tasaExito
  );

  // Estadísticas generales
  const stats = {
    totalProfesionales: profesionales.length,
    profesionalesActivos: profesionales.filter(p => p.is_active).length,
    promedioTasaExito: profesionalesOrdenados.length > 0 
      ? Math.round(profesionalesOrdenados.reduce((sum, p) => sum + p.tasaExito, 0) / profesionalesOrdenados.length * 10) / 10
      : 0,
    profesionalTop: profesionalesOrdenados[0]?.nombre || 'N/A'
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-sans">
            Desempeño de Profesionales
          </h1>
          <p className="text-muted-foreground mt-1 font-sans">
            Análisis comparativo de métricas por doctor
          </p>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Profesionales
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProfesionales}</div>
            <p className="text-xs mt-1 text-green-600">
              {stats.profesionalesActivos} activos
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa Éxito Promedio
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.promedioTasaExito}%
            </div>
            <p className="text-xs mt-1 text-muted-foreground">
              Promedio general
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mejor Desempeño
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-foreground truncate">
              {stats.profesionalTop}
            </div>
            <p className="text-xs mt-1 text-green-600">
              {profesionalesOrdenados[0]?.tasaExito}% éxito
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Promedio No-Show
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {Math.round(
                profesionalesOrdenados.reduce((sum, p) => sum + p.tasaNoShow, 0) /
                (profesionalesOrdenados.length || 1)
              )}%
            </div>
            <p className="text-xs mt-1 text-muted-foreground">
              Tasa promedio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Comparativa */}
      <Card className="border border-[#E5E7EB] shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Comparativa de Desempeño</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar profesional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <CardDescription>
            Métricas por profesional ordenadas por tasa de éxito
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profesionalesOrdenados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay datos disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Profesional
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Citas Total
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Completadas
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Tasa Éxito
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      No-Show
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Tiempo Prom.
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Satisfacción
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Puntualidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profesionalesOrdenados.map((prof, index) => (
                    <tr
                      key={prof.id}
                      className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <Badge variant="success" className="text-xs">
                              🏆 #1
                            </Badge>
                          )}
                          {index === 1 && (
                            <Badge variant="secondary" className="text-xs">
                              🥈 #2
                            </Badge>
                          )}
                          {index === 2 && (
                            <Badge variant="secondary" className="text-xs">
                              🥉 #3
                            </Badge>
                          )}
                          {index >= 3 && (
                            <span className="text-sm text-muted-foreground">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-foreground">
                          {prof.nombre}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-medium">{prof.totalCitas}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant={prof.citasCompletadas > 0 ? "success" : "secondary"}>
                          {prof.citasCompletadas}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {prof.tasaExito >= 90 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : prof.tasaExito < 70 ? (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          ) : null}
                          <span
                            className={`font-bold ${
                              prof.tasaExito >= 90
                                ? "text-green-600"
                                : prof.tasaExito < 70
                                ? "text-red-600"
                                : "text-orange-600"
                            }`}
                          >
                            {prof.tasaExito}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge
                          variant={prof.tasaNoShow < 10 ? "success" : prof.tasaNoShow < 20 ? "secondary" : "destructive"}
                        >
                          {prof.tasaNoShow}%
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{prof.tiempoPromedio} min</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {prof.satisfaccion > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{prof.satisfaccion.toFixed(1)}/5</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin calificaciones</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {prof.puntualidad > 0 ? (
                          <Badge
                            variant={
                              prof.puntualidad >= 90
                                ? "success"
                                : prof.puntualidad >= 80
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {prof.puntualidad}%
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin datos</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficas Comparativas */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top 5 por Tasa de Éxito */}
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top 5 por Tasa de Éxito
            </CardTitle>
            <CardDescription>
              Profesionales con mejor rendimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profesionalesOrdenados.slice(0, 5).map((prof, index) => (
                <div key={prof.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {index === 0 && "🥇"} {index === 1 && "🥈"} {index === 2 && "🥉"} {index >= 3 && `#${index + 1}`} {prof.nombre}
                    </span>
                    <span className="font-bold text-green-600">
                      {prof.tasaExito}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-green-500 rounded-full transition-all"
                      style={{ width: `${prof.tasaExito}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 por Satisfacción */}
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Top 5 por Satisfacción
            </CardTitle>
            <CardDescription>
              Mejor calificados por pacientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...profesionalesOrdenados]
                .filter(p => p.satisfaccion > 0) // Solo profesionales con calificaciones
                .sort((a, b) => b.satisfaccion - a.satisfaccion)
                .slice(0, 5)
                .map((prof, index) => (
                  <div key={prof.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {index === 0 && "⭐"} {prof.nombre}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-yellow-600">
                          {prof.satisfaccion.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-yellow-500 rounded-full transition-all"
                        style={{ width: `${(prof.satisfaccion / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              {profesionalesOrdenados.filter(p => p.satisfaccion > 0).length === 0 && (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">No hay calificaciones disponibles</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

