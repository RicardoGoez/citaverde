"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Clock,
  QrCode,
  X
} from "lucide-react";
import { getCitas, createCita, getServicios, getProfesionales, getSedes, updateCita } from "@/lib/actions/database";
import { useState, useEffect } from "react";
import { useToasts } from "@/lib/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CitasRecepcionista() {
  const [citas, setCitas] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { success, error } = useToasts();

  const [formData, setFormData] = useState({
    paciente: "",
    servicio: "",
    profesional: "",
    sede: "",
    fecha: "",
    hora: ""
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [citasData, serviciosData, profesionalesData, sedesData] = await Promise.all([
          getCitas(),
          getServicios(),
          getProfesionales(),
          getSedes()
        ]);
        setCitas(citasData);
        setServicios(serviciosData);
        setProfesionales(profesionalesData);
        setSedes(sedesData);
      } catch (err) {
        console.error("Error cargando datos:", err);
        error("Error", "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const citasHoy = citas.filter(c => {
    const fecha = new Date(c.fecha);
    return fecha >= hoy && fecha < new Date(hoy.getTime() + 24 * 60 * 60 * 1000);
  });

  const citasFiltradas = citasHoy.filter(cita => {
    const search = searchTerm.toLowerCase();
    return (
      (cita.paciente_name || cita.user_name || '').toLowerCase().includes(search) ||
      (cita.servicio || cita.servicio_name || '').toLowerCase().includes(search) ||
      (cita.profesional || cita.profesional_name || '').toLowerCase().includes(search)
    );
  });

  const handleCreateCita = async () => {
    if (!formData.paciente || !formData.servicio || !formData.fecha || !formData.hora) {
      error("Error", "Complete todos los campos requeridos");
      return;
    }

    try {
      const servicioSeleccionado = servicios.find(s => s.id === formData.servicio);
      const profesionalSeleccionado = profesionales.find(p => p.id === formData.profesional);
      const sedeSeleccionada = sedes.find(s => s.id === formData.sede);

      await createCita({
        user_id: 'manual', // Usuario manual
        servicio_id: formData.servicio,
        servicio: servicioSeleccionado?.name || '',
        profesional_id: formData.profesional || '',
        profesional: profesionalSeleccionado?.name || '',
        sede_id: formData.sede || sedeSeleccionada?.id || '',
        fecha: formData.fecha,
        hora: formData.hora
      });

      // Recargar citas
      const citasData = await getCitas();
      setCitas(citasData);

      success("Éxito", "Cita creada correctamente");
      setIsDialogOpen(false);
      setFormData({
        paciente: "",
        servicio: "",
        profesional: "",
        sede: "",
        fecha: "",
        hora: ""
      });
    } catch (err: any) {
      console.error("Error creando cita:", err);
      error("Error", err.message || "No se pudo crear la cita");
    }
  };

  const handleCheckIn = async (cita: any) => {
    try {
      await updateCita(cita.id, { 
        estado: 'en_curso',
        hora_checkin: new Date().toISOString()
      });
      
      // Recargar citas
      const citasData = await getCitas();
      setCitas(citasData);
      
      success("Check-in", `Check-in realizado`);
    } catch (err: any) {
      console.error("Error en check-in:", err);
      error("Error", err.message || "No se pudo realizar check-in");
    }
  };

  const handleCancel = async (cita: any) => {
    try {
      await updateCita(cita.id, { estado: 'cancelada' });
      
      // Recargar citas
      const citasData = await getCitas();
      setCitas(citasData);
      
      success("Cancelada", `Cita cancelada`);
    } catch (err: any) {
      console.error("Error cancelando cita:", err);
      error("Error", err.message || "No se pudo cancelar la cita");
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelada':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'en_curso':
        return 'bg-blue-100 text-blue-700 border-blue-300';
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Citas</h1>
          <p className="text-gray-600 mt-1">Administra las citas del día</p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-[#2563EB] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#1E3A8A] text-white shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
            <Input
              placeholder="Buscar por nombre, servicio o profesional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12"
            />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Total Citas</p>
                <p className="text-3xl font-bold text-blue-700">{citasHoy.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Completadas</p>
                <p className="text-3xl font-bold text-green-700">
                  {citasHoy.filter(c => c.estado === 'completada').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-700">
                  {citasHoy.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Canceladas</p>
                <p className="text-3xl font-bold text-red-700">
                  {citasHoy.filter(c => c.estado === 'cancelada').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de citas */}
      <Card className="border-2 border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
          <CardTitle className="text-xl font-bold text-gray-900">Citas del Día</CardTitle>
          <p className="text-sm text-gray-600">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Paciente</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Servicio</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Profesional</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Hora</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {citasFiltradas.length > 0 ? (
                  citasFiltradas.map((cita) => (
                    <tr 
                      key={cita.id} 
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200"
                    >
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{cita.paciente_name || cita.user_name || 'Sin nombre'}</p>
                            {cita.telefono && (
                              <p className="text-xs text-gray-500">{cita.telefono}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                          {cita.servicio || cita.servicio_name || 'Sin servicio'}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <p className="text-sm font-medium text-gray-900">{cita.profesional || cita.profesional_name || 'Sin asignar'}</p>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Clock className="h-4 w-4" />
                          {cita.hora || 'Sin hora'}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <Badge 
                          variant="outline" 
                          className={`${getEstadoColor(cita.estado)} border-2 font-semibold`}
                        >
                          {cita.estado}
                        </Badge>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex justify-end gap-2">
                          {(cita.estado === 'confirmada' || cita.estado === 'pendiente') && (
                            <Button 
                              size="sm" 
                              onClick={() => handleCheckIn(cita)}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              Check-in
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCancel(cita)}
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 shadow-sm"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Calendar className="h-16 w-16 text-gray-300" />
                        <p className="text-gray-500 font-medium text-lg">No hay citas para mostrar</p>
                        <p className="text-gray-400 text-sm">Comienza agregando una nueva cita</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal para nueva cita */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">Nueva Cita Manual</DialogTitle>
            <p className="text-sm text-gray-600 mt-1">Completa los datos para crear una nueva cita</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paciente">Paciente *</Label>
                <Input
                  id="paciente"
                  value={formData.paciente}
                  onChange={(e) => setFormData({ ...formData, paciente: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="servicio">Servicio *</Label>
                <Select value={formData.servicio} onValueChange={(value) => setFormData({ ...formData, servicio: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicios.map((servicio) => (
                      <SelectItem key={servicio.id} value={servicio.id}>
                        {servicio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="profesional">Profesional</Label>
                <Select value={formData.profesional} onValueChange={(value) => setFormData({ ...formData, profesional: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar profesional" />
                  </SelectTrigger>
                  <SelectContent>
                    {profesionales.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sede">Sede</Label>
                <Select value={formData.sede} onValueChange={(value) => setFormData({ ...formData, sede: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedes.map((sede) => (
                      <SelectItem key={sede.id} value={sede.id}>
                        {sede.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="hora">Hora *</Label>
                <Input
                  id="hora"
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCita} className="bg-[#2563EB] hover:bg-[#1E40AF]">
              Crear Cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
