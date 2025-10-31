"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Calendar, CheckCircle2, XCircle, Clock, MoreVertical, Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { useState, useEffect } from "react";
import { getCitas, getUsuarios, getServicios, getProfesionales, getSedes, updateCita } from "@/lib/actions/database";
import { Skeleton } from "@/components/ui/skeleton";
import { useToasts } from "@/lib/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

export default function CitasPage() {
  const [citas, setCitas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCita, setEditingCita] = useState<any>(null);
  const { success, error } = useToasts();
  
  // Form state
  const [formData, setFormData] = useState({
    user_id: "",
    profesional_id: "",
    servicio: "",
    sede_id: "",
    fecha: "",
    hora: "",
    estado: "pendiente",
    notas: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [citasData, usuariosData, serviciosData, profesionalesData, sedesData] = await Promise.all([
          getCitas(),
          getUsuarios(),
          getServicios(),
          getProfesionales(),
          getSedes(),
        ]);
        setCitas(citasData);
        setUsuarios(usuariosData);
        setServicios(serviciosData);
        setProfesionales(profesionalesData);
        setSedes(sedesData);
      } catch (err) {
        console.error("Error cargando citas:", err);
        error("Error", "No se pudieron cargar las citas");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [error]);

  const handleOpenDialog = (cita?: any) => {
    if (cita) {
      setIsEditing(true);
      setEditingCita(cita);
      setFormData({
        user_id: cita.user_id,
        profesional_id: cita.profesional_id || "",
        servicio: cita.servicio,
        sede_id: cita.sede_id || "",
        fecha: cita.fecha,
        hora: cita.hora,
        estado: cita.estado,
        notas: cita.notas || "",
      });
    } else {
      setIsEditing(false);
      setEditingCita(null);
      const hoy = new Date().toISOString().split('T')[0];
      setFormData({
        user_id: "",
        profesional_id: "",
        servicio: "",
        sede_id: "",
        fecha: hoy,
        hora: "09:00",
        estado: "pendiente",
        notas: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (cita: any) => {
    if (confirm(`¿Estás seguro de eliminar esta cita?`)) {
      try {
        setCitas(citas.filter(c => c.id !== cita.id));
        success("Eliminada", "Cita eliminada exitosamente");
      } catch (err) {
        error("Error", "No se pudo eliminar la cita");
      }
    }
  };

  const handleMarcarAtendida = async (cita: any) => {
    try {
      await updateCita(cita.id, {
        estado: 'completada',
        no_show: false,
        updated_at: new Date().toISOString()
      });
      
      // Actualizar en el estado local
      setCitas(citas.map(c => 
        c.id === cita.id 
          ? { ...c, estado: 'completada', no_show: false }
          : c
      ));
      
      success("Éxito", "Cita marcada como atendida");
    } catch (err) {
      error("Error", "No se pudo actualizar la cita");
    }
  };

  const handleMarcarNoAsistio = async (cita: any) => {
    try {
      await updateCita(cita.id, {
        estado: 'cancelada',
        no_show: true,
        updated_at: new Date().toISOString()
      });
      
      // Actualizar en el estado local
      setCitas(citas.map(c => 
        c.id === cita.id 
          ? { ...c, estado: 'cancelada', no_show: true }
          : c
      ));
      
      success("Actualizado", "Cita marcada como no asistió");
    } catch (err) {
      error("Error", "No se pudo actualizar la cita");
    }
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        success("Actualizada", "Cita actualizada exitosamente");
      } else {
        const newId = `CIT-${Date.now().toString().slice(-6)}`;
        const nuevaCita = {
          id: newId,
          ...formData,
        };
        setCitas([...citas, nuevaCita]);
        success("Creada", "Cita creada exitosamente");
      }
      setIsDialogOpen(false);
    } catch (err) {
      error("Error", "No se pudo guardar la cita");
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      confirmada: { variant: "success", label: "Confirmada" },
      en_curso: { variant: "warning", label: "En Curso" },
      pendiente: { variant: "default", label: "Pendiente" },
      completada: { variant: "success", label: "Completada" },
      cancelada: { variant: "destructive", label: "Cancelada" },
    };
    const config = variants[estado] || { variant: "default", label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUserName = (userId: string) => {
    const user = usuarios.find(u => u.id === userId);
    return user?.name || "Desconocido";
  };

  const filteredCitas = citas.filter(cita => {
    const userName = getUserName(cita.user_id);
    return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           cita.servicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           cita.profesional?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-sans">Gestión de Citas</h1>
          <p className="text-muted-foreground mt-1 font-sans">Administra y monitorea todas las citas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <Input
              placeholder="Buscar citas..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d]"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-sans">Todas las Citas</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar citas..." 
                  className="pl-10 w-64 font-sans" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="font-sans">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCitas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground font-sans">No hay citas disponibles</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCitas.map((cita) => (
                  <TableRow key={cita.id}>
                    <TableCell className="font-medium">{cita.id}</TableCell>
                    <TableCell>{getUserName(cita.user_id)}</TableCell>
                    <TableCell>{cita.servicio}</TableCell>
                    <TableCell className="text-muted-foreground">{cita.profesional}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{cita.fecha}</div>
                        <div className="text-muted-foreground">{cita.hora}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getEstadoBadge(cita.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(cita.estado === 'confirmada' || cita.estado === 'pendiente' || cita.estado === 'en_curso') && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleMarcarAtendida(cita)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              aria-label="Marcar como atendida"
                              title="Marcar como atendida"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleMarcarNoAsistio(cita)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              aria-label="Marcar como no asistió"
                              title="No asistió"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenDialog(cita)}
                          aria-label="Editar cita"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(cita)}
                          className="text-[#ef4444] hover:text-[#dc2626]"
                          aria-label="Eliminar cita"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Crear/Editar Cita */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogClose onOpenChange={setIsDialogOpen} />
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Cita" : "Nueva Cita"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Modifica la información de la cita" : "Completa los datos para crear una nueva cita"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="user_id" className="text-sm font-medium">Paciente *</label>
                <select
                  id="user_id"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                  required
                >
                  <option value="">Selecciona un paciente</option>
                  {usuarios.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="servicio" className="text-sm font-medium">Servicio *</label>
                <Input
                  id="servicio"
                  value={formData.servicio}
                  onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                  placeholder="Consulta General"
                  required
                />
              </div>
              <div>
                <label htmlFor="profesional_id" className="text-sm font-medium">Profesional</label>
                <select
                  id="profesional_id"
                  value={formData.profesional_id}
                  onChange={(e) => setFormData({ ...formData, profesional_id: e.target.value })}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                >
                  <option value="">Selecciona un profesional</option>
                  {profesionales.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sede_id" className="text-sm font-medium">Sede</label>
                <select
                  id="sede_id"
                  value={formData.sede_id}
                  onChange={(e) => setFormData({ ...formData, sede_id: e.target.value })}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                >
                  <option value="">Selecciona una sede</option>
                  {sedes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      {sede.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="fecha" className="text-sm font-medium">Fecha *</label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="hora" className="text-sm font-medium">Hora *</label>
                <Input
                  id="hora"
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="estado" className="text-sm font-medium">Estado</label>
                <select
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="en_curso">En Curso</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="notas" className="text-sm font-medium">Notas</label>
              <textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[80px]"
                placeholder="Observaciones o notas adicionales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? "Guardar Cambios" : "Crear Cita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
