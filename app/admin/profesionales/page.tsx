"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, MoreVertical, Edit, Trash2, UserPlus } from "lucide-react";
import { getProfesionales, getSedes, getServicios, createProfesional, updateProfesional, deleteProfesional } from "@/lib/actions/database";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToasts } from "@/lib/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSede } from "@/lib/hooks/use-sede";
import { usePermissions } from "@/lib/hooks/use-permissions";

export default function ProfesionalesPage() {
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfesional, setEditingProfesional] = useState<any>(null);
  const { success, error } = useToasts();
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    sede_id: "",
    servicios: [] as string[],
    is_active: true,
  });

  const { sedeSeleccionada } = useSede();
  const { hasPerm, hasPermAsync, refreshPermissions, loading: permissionsLoading } = usePermissions();

  // Escuchar cambios en permisos y refrescar la UI
  useEffect(() => {
    const handlePermissionsChanged = () => {
      refreshPermissions();
    };

    window.addEventListener('permissionsChanged', handlePermissionsChanged);
    
    return () => {
      window.removeEventListener('permissionsChanged', handlePermissionsChanged);
    };
  }, [refreshPermissions]);

  useEffect(() => {
    const loadData = async () => {
      if (!sedeSeleccionada) {
        setLoading(false);
        return;
      }

      try {
        const [profesionalesData, sedesData, serviciosData] = await Promise.all([
          getProfesionales(sedeSeleccionada.id),
          getSedes(),
          getServicios(sedeSeleccionada.id)
        ]);
        setProfesionales(profesionalesData);
        setSedes(sedesData);
        setServicios(serviciosData);
      } catch (err) {
        console.error("Error cargando datos:", err);
        error("Error", "No se pudieron cargar los datos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [sedeSeleccionada]);

  const handleOpenDialog = (profesional?: any) => {
    if (profesional) {
      setIsEditing(true);
      setEditingProfesional(profesional);
      // Convertir nombres de servicios a IDs
      const serviciosIds = (profesional.servicios || []).map((servicioNombre: string) => {
        const servicio = servicios.find(s => s.name === servicioNombre);
        return servicio?.id || servicioNombre;
      }).filter((id: string) => servicios.some(s => s.id === id));
      
      setFormData({
        name: profesional.name,
        email: profesional.email,
        phone: profesional.phone || "",
        sede_id: profesional.sede_id,
        servicios: serviciosIds,
        is_active: profesional.is_active,
      });
    } else {
      setIsEditing(false);
      setEditingProfesional(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        sede_id: sedeSeleccionada?.id || "",
        servicios: [],
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (profesional: any) => {
    // Verificar permiso de forma asíncrona para asegurar verificación actualizada
    const tienePermiso = await hasPermAsync('profesionales', 'eliminar');
    if (!tienePermiso) {
      error("Sin permisos", "No tienes permiso para eliminar profesionales. Este permiso puede haber sido removido.");
      return;
    }

    if (confirm(`¿Estás seguro de eliminar a ${profesional.name}?`)) {
      try {
        await deleteProfesional(profesional.id);
        // Recargar datos desde la BD
        const profesionalesData = await getProfesionales(sedeSeleccionada?.id);
        setProfesionales(profesionalesData);
        success("Eliminado", `${profesional.name} ha sido eliminado`);
      } catch (err) {
        console.error("Error eliminando profesional:", err);
        error("Error", "No se pudo eliminar el profesional");
      }
    }
  };

  const handleSubmit = async () => {
    // Verificar permisos de forma asíncrona según si es edición o creación
    if (isEditing) {
      const tienePermiso = await hasPermAsync('profesionales', 'editar');
      if (!tienePermiso) {
        error("Sin permisos", "No tienes permiso para editar profesionales. Este permiso puede haber sido removido.");
        return;
      }
    } else {
      const tienePermiso = await hasPermAsync('profesionales', 'crear');
      if (!tienePermiso) {
        error("Sin permisos", "No tienes permiso para crear profesionales. Este permiso puede haber sido removido.");
        return;
      }
    }

    try {
      // Convertir IDs de servicios a nombres
      const serviciosNombres = formData.servicios.map(servId => {
        const servicio = servicios.find(s => s.id === servId);
        return servicio?.name || servId;
      });

      if (isEditing) {
        // Actualizar profesional existente
        const updatedProfesional = {
          ...formData,
          servicios: serviciosNombres
        };
        await updateProfesional(editingProfesional.id, updatedProfesional);
        // Recargar datos desde la BD
        const profesionalesData = await getProfesionales(sedeSeleccionada?.id);
        setProfesionales(profesionalesData);
        success("Actualizado", "Doctor actualizado exitosamente");
      } else {
        // Crear nuevo profesional
        const newId = `PRO-${Date.now().toString().slice(-6)}`;
        const nuevoProfesional = {
          id: newId,
          ...formData,
          servicios: serviciosNombres
        };
        await createProfesional(nuevoProfesional);
        // Recargar datos desde la BD
        const profesionalesData = await getProfesionales(sedeSeleccionada?.id);
        setProfesionales(profesionalesData);
        success("Creado", "Doctor creado exitosamente");
      }
      setIsDialogOpen(false);
    } catch (err) {
      error("Error", "No se pudo guardar el doctor");
    }
  };

  const getSedeName = (sedeId: string) => {
    const sede = sedes.find(s => s.id === sedeId);
    return sede?.name || "N/A";
  };

  const filteredProfesionales = profesionales.filter(prof => 
    prof.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-[#0f172a]">Doctores</h1>
          <p className="text-[#64748b] mt-1">Gestiona el equipo médico</p>
        </div>
        {hasPerm('profesionales', 'crear') && (
          <Button 
            className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d]"
            onClick={() => handleOpenDialog()}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Doctor
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Doctores</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                <Input 
                  placeholder="Buscar doctores..." 
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProfesionales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#64748b]">No hay doctores disponibles</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Doctor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Contacto</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Sede</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Servicios</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#64748b]">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-[#64748b]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfesionales.map((profesional) => (
                    <tr key={profesional.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#0f172a]">{profesional.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#0f172a]">{profesional.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="text-[#0f172a]">{profesional.email}</div>
                          <div className="text-[#64748b]">{profesional.phone || "N/A"}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#475569]">{getSedeName(profesional.sede_id)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {profesional.servicios && profesional.servicios.slice(0, 2).map((servicio: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {servicio}
                            </Badge>
                          ))}
                          {profesional.servicios && profesional.servicios.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{profesional.servicios.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {profesional.is_active ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="secondary">Inactivo</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {hasPerm('profesionales', 'editar') && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenDialog(profesional)}
                              aria-label="Editar profesional"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPerm('profesionales', 'eliminar') && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDelete(profesional)}
                              aria-label="Eliminar profesional"
                            >
                              <Trash2 className="h-4 w-4 text-[#ef4444]" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Crear/Editar Profesional */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogClose onOpenChange={setIsDialogOpen} />
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Doctor" : "Nuevo Doctor"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Modifica la información del doctor" : "Completa los datos para crear un nuevo doctor"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">Nombre Completo *</label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dr. Juan Pérez"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium">Email *</label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan.perez@reservaflow.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="text-sm font-medium">Teléfono</label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 600 123 456"
                />
              </div>
              <div>
                <label htmlFor="sede" className="text-sm font-medium">Sede *</label>
                <select
                  id="sede"
                  value={formData.sede_id}
                  onChange={(e) => setFormData({ ...formData, sede_id: e.target.value })}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                  required
                >
                  <option value="">Selecciona una sede</option>
                  {sedes.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      {sede.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Servicios *</label>
              <div className="space-y-2">
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !formData.servicios.includes(value)) {
                      setFormData({
                        ...formData,
                        servicios: [...formData.servicios, value]
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un servicio para agregar" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicios
                      .filter(serv => !formData.servicios.includes(serv.id))
                      .map((servicio) => (
                        <SelectItem key={servicio.id} value={servicio.id}>
                          {servicio.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formData.servicios.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.servicios.map((servicioId) => {
                      const servicio = servicios.find(s => s.id === servicioId);
                      return servicio ? (
                        <Badge
                          key={servicioId}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              servicios: formData.servicios.filter(id => id !== servicioId)
                            });
                          }}
                        >
                          {servicio.name}
                          <span className="ml-2 text-xs">×</span>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? "Guardar Cambios" : "Crear Doctor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
