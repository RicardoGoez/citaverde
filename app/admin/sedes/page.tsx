"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Phone, Mail, Users, Plus, Edit, Trash2, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { getSedes, createSede, updateSede, deleteSede } from "@/lib/actions/database";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { Skeleton } from "@/components/ui/skeleton";
import { useToasts } from "@/lib/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

export default function SedesPage() {
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSede, setEditingSede] = useState<any>(null);
  const { success, error } = useToasts();
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
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    is_active: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const sedesData = await getSedes();
        setSedes(sedesData);
      } catch (err) {
        console.error("Error cargando sedes:", err);
        error("Error", "No se pudieron cargar las sedes");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [error]);

  const handleOpenDialog = (sede?: any) => {
    if (sede) {
      setIsEditing(true);
      setEditingSede(sede);
      setFormData({
        name: sede.name,
        address: sede.address || "",
        phone: sede.phone || "",
        email: sede.email || "",
        is_active: sede.is_active,
      });
    } else {
      setIsEditing(false);
      setEditingSede(null);
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (sede: any) => {
    // Verificar permiso
    const tienePermiso = await hasPermAsync('sedes', 'eliminar');
    if (!tienePermiso) {
      error("Sin permisos", "No tienes permiso para eliminar sedes. Este permiso puede haber sido removido.");
      return;
    }

    if (confirm(`¿Estás seguro de eliminar la sede ${sede.name}?`)) {
      try {
        await deleteSede(sede.id);
        // Recargar datos desde la BD
        const sedesData = await getSedes();
        setSedes(sedesData);
        success("Eliminada", `${sede.name} ha sido eliminada`);
      } catch (err) {
        console.error("Error eliminando sede:", err);
        error("Error", "No se pudo eliminar la sede");
      }
    }
  };

  const handleSubmit = async () => {
    // Verificar permisos
    if (isEditing) {
      const tienePermiso = await hasPermAsync('sedes', 'editar');
      if (!tienePermiso) {
        error("Sin permisos", "No tienes permiso para editar sedes. Este permiso puede haber sido removido.");
        return;
      }
    } else {
      const tienePermiso = await hasPermAsync('sedes', 'crear');
      if (!tienePermiso) {
        error("Sin permisos", "No tienes permiso para crear sedes. Este permiso puede haber sido removido.");
        return;
      }
    }

    try {
      if (isEditing) {
        await updateSede(editingSede.id, {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          is_active: formData.is_active,
        });
        // Recargar datos desde la BD
        const sedesData = await getSedes();
        setSedes(sedesData);
        success("Actualizada", "Sede actualizada exitosamente");
      } else {
        const newId = `SED-${Date.now().toString().slice(-6)}`;
        await createSede({
          id: newId,
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          is_active: formData.is_active,
        });
        // Recargar datos desde la BD
        const sedesData = await getSedes();
        setSedes(sedesData);
        success("Creada", "Sede creada exitosamente");
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error guardando sede:", err);
      error("Error", "No se pudo guardar la sede");
    }
  };

  const filteredSedes = sedes.filter(sede => 
    sede.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sede.address?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-[#0f172a]">Sedes</h1>
          <p className="text-[#64748b] mt-1">Gestiona las sedes y ubicaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <Input
              placeholder="Buscar sedes..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {hasPerm('sedes', 'crear') && (
            <Button 
              className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d]"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Sede
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {filteredSedes.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-[#64748b]">No hay sedes disponibles</p>
          </div>
        ) : filteredSedes.map((sede) => (
          <Card key={sede.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-[#16a34a]" />
                  </div>
                  <CardTitle>{sede.name}</CardTitle>
                </div>
                {sede.is_active ? (
                  <Badge variant="success">Activa</Badge>
                ) : (
                  <Badge variant="secondary">Inactiva</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-[#64748b]">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{sede.address || "Sin dirección"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748b]">
                  <Phone className="h-4 w-4" />
                  <span>{sede.phone || "Sin teléfono"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748b]">
                  <Mail className="h-4 w-4" />
                  <span>{sede.email || "Sin email"}</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenDialog(sede)}
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(sede)}
                    className="text-[#ef4444] hover:text-[#dc2626]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para Crear/Editar Sede */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogClose onOpenChange={setIsDialogOpen} />
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Sede" : "Nueva Sede"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Modifica la información de la sede" : "Completa los datos para crear una nueva sede"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">Nombre de la Sede *</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Madrid Centro"
                required
              />
            </div>
            <div>
              <label htmlFor="address" className="text-sm font-medium">Dirección</label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Calle Gran Vía 123, 28013 Madrid"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="text-sm font-medium">Teléfono</label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 91 123 4567"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="madrid@reservaflow.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="is_active" className="text-sm font-medium">Estado</label>
              <select
                id="is_active"
                value={formData.is_active ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                className="w-full h-10 px-3 border border-input rounded-md bg-background"
              >
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? "Guardar Cambios" : "Crear Sede"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
