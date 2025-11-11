"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { getCitas } from "@/lib/actions/database";
import { Skeleton } from "@/components/ui/skeleton";
import { useToasts } from "@/lib/hooks/use-toast";

export default function CalendarioPage() {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { success, error } = useToasts();

  useEffect(() => {
    const loadData = async () => {
      try {
        const citasData = await getCitas();
        setCitas(citasData);
      } catch (err) {
        console.error("Error cargando datos:", err);
        error("Error", "No se pudieron cargar los datos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [error]);

  // Navegación de fechas
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generar días del mes
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Obtener citas de un día específico
  const getCitasDelDia = (dia: number) => {
    const fechaStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    return citas.filter(cita => cita.fecha === fechaStr);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-sans">Calendario de Citas</h1>
          <p className="text-muted-foreground mt-1 font-sans">Visualiza todas las citas programadas</p>
        </div>
      </div>

      {/* Calendario */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-semibold font-sans">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Días de la semana */}
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((dia) => (
              <div key={dia} className="text-center font-semibold text-muted-foreground py-2">
                {dia}
              </div>
            ))}
            
            {/* Días vacíos antes del primer día */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            
            {/* Días del mes */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dia = index + 1;
              const citasDelDia = getCitasDelDia(dia);
              const esHoy = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), dia).toDateString();
              
              return (
                <div
                  key={dia}
                  className={`aspect-square border rounded-lg p-2 overflow-y-auto ${
                    esHoy ? 'bg-[#F3F4F6] border-[#16A34A] border-2' : 'border-[#E5E7EB] hover:border-[#16A34A]'
                  }`}
                >
                  <div className={`font-semibold mb-1 ${esHoy ? 'text-[#16A34A]' : 'text-foreground'}`}>
                    {dia}
                  </div>
                  <div className="space-y-1">
                    {citasDelDia.slice(0, 3).map((cita) => (
                      <div
                        key={cita.id}
                        className={`text-xs p-1 rounded truncate ${
                          cita.estado === 'completada' ? 'bg-green-100 text-green-800' :
                          cita.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                          cita.estado === 'en_curso' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                        title={`${cita.hora} - ${cita.servicio}`}
                      >
                        {cita.hora} {cita.servicio}
                      </div>
                    ))}
                    {citasDelDia.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{citasDelDia.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-800 rounded"></div>
              <span className="text-sm">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-800 rounded"></div>
              <span className="text-sm">En Curso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-800 rounded"></div>
              <span className="text-sm">Completada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-800 rounded"></div>
              <span className="text-sm">Cancelada</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
