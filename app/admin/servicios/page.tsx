"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, Clock, Euro, Users, Plus, Edit, Trash2, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getServicios, getSedes } from "@/lib/actions/database";
import { Skeleton } from "@/components/ui/skeleton";
import { useToasts } from "@/lib/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingServicio, setEditingServicio] = useState<any>(null);
  const { success, error } = useToasts();
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sede_id: "",
    is_active: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const serviciosData = await getServicios();
        const sedesData = await getSedes();
        setServicios(serviciosData);
        setSedes(sedesData);
      } catch (err) {
        console.error("Error cargando servicios:", err);
        error("Error", "No se pudieron cargar los servicios");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [error]);

  const handleOpenDialog = (servicio?: any) => {
    if (servicio) {
      setIsEditing(true);
      setEditingServicio(servicio);
      setFormData({
        name: servicio.name,
        sede_id: servicio.sede_id,
        is_active: servicio.is_active,
      });
    } else {
      setIsEditing(false);
      setEditingServicio(null);
      setFormData({
        name: "",
        sede_id: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (servicio: any) => {
    if (confirm(`¿Estás seguro de eliminar el servicio ${servicio.name}?`)) {
      try {
        setServicios(servicios.filter(s => s.id !== servicio.id));
        success("Eliminado", `${servicio.name} ha sido eliminado`);
      } catch (err) {
        error("Error", "No se pudo eliminar el servicio");
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        success("Actualizado", "Servicio actualizado exitosamente");
      } else {
        const newId = `SRV-${Date.now().toString().slice(-6)}`;
        const nuevoServicio = {
          id: newId,
          ...formData,
        };
        setServicios([...servicios, nuevoServicio]);
        success("Creado", "Servicio creado exitosamente");
      }
      setIsDialogOpen(false);
    } catch (err) {
      error("Error", "No se pudo guardar el servicio");
    }
  };

  const filteredServicios = servicios.filter(servicio => 
    servicio.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSedeName = (sedeId: string) => {
    const sede = sedes.find(s => s.id === sedeId);
    return sede?.name || "N/A";
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Servicios</h1>
          <p className="text-muted-foreground mt-1">Gestiona los servicios ofrecidos</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar servicios..."
              className="pl-10 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] w-full sm:w-auto"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Servicio
          </Button>
        </div>
      </div>

      {/* Grid de tarjetas responsive */}
      {filteredServicios.length === 0 ? (
        <Card className="border border-[#E5E7EB] shadow-sm">
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium">No hay servicios disponibles</p>
            <p className="text-sm text-muted-foreground mt-1">Crea tu primer servicio para comenzar</p>
          </CardContent>
        </Card>
      ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
           {filteredServicios.map((servicio, index) => (
             <Card
               key={servicio.id}
               className="group border border-[#E5E7EB] hover:border-[#16A34A] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
               onClick={() => handleOpenDialog(servicio)}
                           >
                <CardContent className="p-3">
                   <div className="flex items-start justify-between gap-2 mb-2">
                     <div className="flex-1 min-w-0">
                       <h3 className="text-sm font-semibold text-foreground group-hover:text-[#16A34A] transition-colors truncate leading-tight">
                         {servicio.name}
                       </h3>
                     </div>
                     {servicio.is_active ? (
                       <Badge variant="success" className="shrink-0 text-[10px] py-0 px-1.5 h-5">
                         Activo
                       </Badge>
                     ) : (
                       <Badge variant="outline" className="shrink-0 text-[10px] py-0 px-1.5 h-5">
                         Inactivo
                       </Badge>
                     )}
                   </div>

                                       {/* Información adicional compacta */}
                    <div className="space-y-1.5 mb-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{getSedeName(servicio.sede_id)}</span>
                      </div>
                    </div>

                   {/* Acciones compactas */}
                   <div className="flex items-center gap-1 pt-2 border-t border-[#E5E7EB] opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button 
                       variant="ghost" 
                       size="sm"
                       className="flex-1 h-7 text-xs hover:bg-[#F0FDF4] hover:text-[#16A34A] px-2"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleOpenDialog(servicio);
                       }}
                     >
                       <Edit className="h-3 w-3 mr-1" />
                       Editar
                     </Button>
                     <Button 
                       variant="ghost" 
                       size="icon"
                       className="h-7 w-7 hover:bg-[#FEF2F2] hover:text-[#EF4444]"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleDelete(servicio);
                       }}
                     >
                       <Trash2 className="h-3 w-3" />
                     </Button>
                   </div>
                 </CardContent>
               </Card>
           ))}
         </div>
      )}

      {/* Dialog para Crear/Editar Servicio */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogClose onOpenChange={setIsDialogOpen} />
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Modifica la información del servicio" : "Completa los datos para crear un nuevo servicio"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">Nombre del Servicio *</label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Consulta General"
                  required
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

              <div>
                <label htmlFor="is_active" className="text-sm font-medium">Estado</label>
                <select
                  id="is_active"
                  value={formData.is_active ? "true" : "false"}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="w-full sm:w-auto">
              {isEditing ? "Guardar Cambios" : "Crear Servicio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
