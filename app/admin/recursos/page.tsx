"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Monitor, Stethoscope, Clock, Plus, Edit, Trash2, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToasts } from "@/lib/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { getRecursos, createRecurso, updateRecurso, deleteRecurso, getSedes } from "@/lib/actions/database";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useSede } from "@/lib/hooks/use-sede";

interface Recurso {
  id: string;
  nombre: string;
  tipo: "consultorio" | "sala" | "equipo" | "vehiculo";
  sede_id: string;
  estado: "disponible" | "ocupado" | "mantenimiento";
  capacidad?: number;
  descripcion?: string;
}

export default function RecursosPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecurso, setEditingRecurso] = useState<Recurso | null>(null);
  const { success, error } = useToasts();
  const { sedeSeleccionada } = useSede();
  const { hasPerm, hasPermAsync, refreshPermissions } = usePermissions();

  // Escuchar cambios en permisos
  useEffect(() => {
    const handlePermissionsChanged = () => {
      refreshPermissions();
    };

    window.addEventListener('permissionsChanged', handlePermissionsChanged);
    
    return () => {
      window.removeEventListener('permissionsChanged', handlePermissionsChanged);
    };
  }, [refreshPermissions]);
  
  const [formData, setFormData] = useState<{
    nombre: string;
    tipo: "consultorio" | "sala" | "equipo" | "vehiculo";
    sede_id: string;
    estado: "disponible" | "ocupado" | "mantenimiento";
    capacidad: number;
    descripcion: string;
  }>({
    nombre: "",
    tipo: "consultorio",
    sede_id: "",
    estado: "disponible",
    capacidad: 1,
    descripcion: "",
  });

  useEffect(() => {
    cargarDatos();
  }, [sedeSeleccionada]);

  const cargarDatos = async () => {
    if (!sedeSeleccionada) {
      setLoading(false);
      return;
    }

    try {
      const [recursosData, sedesData] = await Promise.all([
        getRecursos(sedeSeleccionada.id),
        getSedes()
      ]);
      
      // Mapear datos de BD al formato esperado
      const recursosMapeados = recursosData.map((r: any) => ({
        id: r.id,
        nombre: r.name,
        tipo: r.tipo,
        sede_id: r.sede_id,
        estado: r.estado || 'disponible',
        capacidad: r.capacidad || 1,
        descripcion: r.descripcion || '',
      }));
      
      setRecursos(recursosMapeados);
      setSedes(sedesData);
    } catch (err) {
      console.error("Error cargando datos:", err);
      error("Error", "No se pudieron cargar los recursos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (recurso?: Recurso) => {
    if (recurso) {
      setEditingRecurso(recurso);
      setFormData({
        nombre: recurso.nombre,
        tipo: recurso.tipo,
        sede_id: recurso.sede_id,
        estado: recurso.estado,
        capacidad: recurso.capacidad || 1,
        descripcion: recurso.descripcion || "",
      });
    } else {
      setEditingRecurso(null);
      setFormData({
        nombre: "",
        tipo: "consultorio",
        sede_id: "",
        estado: "disponible",
        capacidad: 1,
        descripcion: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Verificar permisos
    if (editingRecurso) {
      const tienePermiso = await hasPermAsync('recursos', 'editar');
      if (!tienePermiso) {
        error("Sin permisos", "No tienes permiso para editar recursos. Este permiso puede haber sido removido.");
        return;
      }
    } else {
      const tienePermiso = await hasPermAsync('recursos', 'crear');
      if (!tienePermiso) {
        error("Sin permisos", "No tienes permiso para crear recursos. Este permiso puede haber sido removido.");
        return;
      }
    }

    if (!formData.nombre || !formData.sede_id) {
      error("Error", "Completa los campos requeridos");
      return;
    }

    try {
      if (editingRecurso) {
        await updateRecurso(editingRecurso.id, {
          name: formData.nombre,
          tipo: formData.tipo,
          sede_id: formData.sede_id,
          servicios: [],
          is_active: formData.estado !== 'mantenimiento',
        });
        // Recargar datos desde la BD
        await cargarDatos();
        success("Éxito", "Recurso actualizado");
      } else {
        const newId = `REC-${Date.now().toString().slice(-6)}`;
        await createRecurso({
          id: newId,
          name: formData.nombre,
          tipo: formData.tipo,
          sede_id: formData.sede_id,
          servicios: [],
          is_active: formData.estado !== 'mantenimiento',
        });
        // Recargar datos desde la BD
        await cargarDatos();
        success("Éxito", "Recurso creado");
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error guardando recurso:", err);
      error("Error", "Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    // Verificar permiso
    const tienePermiso = await hasPermAsync('recursos', 'eliminar');
    if (!tienePermiso) {
      error("Sin permisos", "No tienes permiso para eliminar recursos. Este permiso puede haber sido removido.");
      return;
    }

    if (confirm("¿Eliminar este recurso?")) {
      try {
        await deleteRecurso(id);
        // Recargar datos desde la BD
        await cargarDatos();
        success("Éxito", "Recurso eliminado");
      } catch (err) {
        console.error("Error eliminando recurso:", err);
        error("Error", "Error al eliminar");
      }
    }
  };

  const getTipoBadge = (tipo: string) => {
    const configs: Record<string, { variant: any; icon: any; label: string }> = {
      consultorio: { variant: "default", icon: Stethoscope, label: "Consultorio" },
      sala: { variant: "default", icon: Monitor, label: "Sala" },
      equipo: { variant: "default", icon: MapPin, label: "Equipo" },
      vehiculo: { variant: "outline", icon: Building2, label: "Vehículo" },
    };
    const config = configs[tipo] || configs.vehiculo;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getEstadoBadge = (estado: string) => {
    const configs: Record<string, { variant: any; label: string }> = {
      disponible: { variant: "success", label: "Disponible" },
      ocupado: { variant: "warning", label: "Ocupado" },
      mantenimiento: { variant: "destructive", label: "Mantenimiento" },
    };
    const config = configs[estado] || { variant: "default", label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSedeName = (sedeId: string) => {
    return sedes.find(s => s.id === sedeId)?.name || sedeId;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-sans">Gestión de Recursos</h1>
          <p className="text-muted-foreground mt-1 font-sans">Administra consultorios, salas, equipos y vehículos</p>
        </div>
        {hasPerm('recursos', 'crear') && (
          <Button 
            className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d]"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Recurso
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="font-sans">Todos los Recursos</CardTitle>
          <CardDescription>Gestiona los recursos disponibles en cada sede</CardDescription>
        </CardHeader>
        <CardContent>
          {recursos.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-sans">No hay recursos registrados</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recursos.map((recurso) => (
                <div
                  key={recurso.id}
                  className="border border-[#E5E7EB] rounded-lg p-4 hover:border-[#16A34A] hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{recurso.nombre}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{getSedeName(recurso.sede_id)}</p>
                    </div>
                    {getEstadoBadge(recurso.estado)}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    {getTipoBadge(recurso.tipo)}
                  </div>

                  {recurso.descripcion && (
                    <p className="text-sm text-muted-foreground mb-3">{recurso.descripcion}</p>
                  )}

                  {recurso.capacidad && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Clock className="h-4 w-4" />
                      <span>Capacidad: {recurso.capacidad}</span>
                    </div>
                  )}

                  {(hasPerm('recursos', 'editar') || hasPerm('recursos', 'eliminar')) && (
                    <div className="flex items-center gap-2">
                      {hasPerm('recursos', 'editar') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(recurso)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      {hasPerm('recursos', 'eliminar') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recurso.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogClose onOpenChange={setIsDialogOpen} />
          <DialogHeader>
            <DialogTitle>{editingRecurso ? "Editar Recurso" : "Nuevo Recurso"}</DialogTitle>
            <DialogDescription>
              {editingRecurso ? "Modifica la información del recurso" : "Completa los datos para crear un nuevo recurso"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nombre *</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Consultorio 101"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo *</label>
                <select
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                >
                  <option value="consultorio">Consultorio</option>
                  <option value="ventanilla">Ventanilla</option>
                  <option value="equipo">Equipo</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sede *</label>
                <select
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                  value={formData.sede_id}
                  onChange={(e) => setFormData({ ...formData, sede_id: e.target.value })}
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
              <div>
                <label className="text-sm font-medium mb-2 block">Estado *</label>
                <select
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                >
                  <option value="disponible">Disponible</option>
                  <option value="ocupado">Ocupado</option>
                  <option value="mantenimiento">Mantenimiento</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Capacidad</label>
                <Input
                  type="number"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descripción</label>
              <textarea
                className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[80px]"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción adicional..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingRecurso ? "Guardar Cambios" : "Crear Recurso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
