"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Edit, Trash2, CheckCircle, Mail, MessageSquare, Zap } from "lucide-react";
import { useToasts } from "@/lib/hooks/use-toast";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { getPlantillas, createPlantilla, updatePlantilla, deletePlantilla } from "@/lib/actions/database";

interface Plantilla {
  id: string;
  nombre: string;
  tipo: "email" | "sms" | "whatsapp" | "push";
  categoria: string;
  asunto?: string;
  contenido: string;
  variables_disponibles: string[];
  activa: boolean;
}

export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Plantilla | null>(null);
  const [formData, setFormData] = useState<Partial<Plantilla>>({
    tipo: "email",
    activa: true,
    variables_disponibles: [],
  });
  const { success: showSuccess, error: showError } = useToasts();
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

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarPlantillas = async () => {
    try {
      const data = await getPlantillas();
      setPlantillas(data as Plantilla[]);
    } catch (error) {
      showError("Error", "No se pudieron cargar las plantillas");
      // Fallback a datos mock
      const mockData: Plantilla[] = [
        {
          id: "p1",
          nombre: "Recordatorio Cita",
          tipo: "email",
          categoria: "recordatorio",
          asunto: "Recordatorio de Cita",
          contenido: "Estimado/a usuario, le recordamos su cita.",
          variables_disponibles: ["{{nombre}}", "{{fecha}}", "{{hora}}", "{{sede}}"],
          activa: true,
        },
      ];
      setPlantillas(mockData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar permisos
    if (editingItem) {
      const tienePermiso = await hasPermAsync('plantillas', 'editar');
      if (!tienePermiso) {
        showError("Sin permisos", "No tienes permiso para editar plantillas. Este permiso puede haber sido removido.");
        return;
      }
    } else {
      const tienePermiso = await hasPermAsync('plantillas', 'crear');
      if (!tienePermiso) {
        showError("Sin permisos", "No tienes permiso para crear plantillas. Este permiso puede haber sido removido.");
        return;
      }
    }
    
    if (!formData.nombre || !formData.contenido) {
      showError("Error", "Complete los campos requeridos");
      return;
    }

    try {
      if (editingItem) {
        await updatePlantilla(editingItem.id, formData);
        await cargarPlantillas();
        showSuccess("Éxito", "Plantilla actualizada");
      } else {
        await createPlantilla(formData as any);
        await cargarPlantillas();
        showSuccess("Éxito", "Plantilla creada");
      }
      
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({ tipo: "email", activa: true, variables_disponibles: [] });
    } catch (error) {
      console.error("Error guardando plantilla:", error);
      showError("Error", "Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    // Verificar permiso
    const tienePermiso = await hasPermAsync('plantillas', 'eliminar');
    if (!tienePermiso) {
      showError("Sin permisos", "No tienes permiso para eliminar plantillas. Este permiso puede haber sido removido.");
      return;
    }

    if (confirm("¿Eliminar esta plantilla?")) {
      try {
        await deletePlantilla(id);
        await cargarPlantillas();
        showSuccess("Éxito", "Eliminado correctamente");
      } catch (error) {
        console.error("Error eliminando plantilla:", error);
        showError("Error", "Error al eliminar");
      }
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "email": return Mail;
      case "sms": return MessageSquare;
      case "whatsapp": return MessageSquare;
      case "push": return Zap;
      default: return FileText;
    }
  };

  const getTipoColor = (tipo: string) => {
    const colors: Record<string, any> = {
      email: "bg-blue-500",
      sms: "bg-green-500",
      whatsapp: "bg-green-600",
      push: "bg-purple-500",
    };
    return colors[tipo] || "bg-gray-500";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111827]">Plantillas de Mensajes</h1>
          <p className="text-[#6B7280] mt-1">Gestiona plantillas con variables dinámicas</p>
        </div>
        {hasPerm('plantillas', 'crear') && (
          <Button onClick={() => {
            setEditingItem(null);
            setFormData({ tipo: "email", activa: true, variables_disponibles: [] });
            setIsDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Plantilla
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plantillas.map((plantilla) => {
          const Icon = getTipoIcon(plantilla.tipo);
          return (
            <Card key={plantilla.id} className="border border-[#E5E7EB] shadow-sm hover:shadow transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getTipoColor(plantilla.tipo)}>
                      <Icon className="h-3 w-3 mr-1" />
                      {plantilla.tipo.toUpperCase()}
                    </Badge>
                    <CardTitle className="text-lg">{plantilla.nombre}</CardTitle>
                  </div>
                  {hasPerm('plantillas', 'editar') || hasPerm('plantillas', 'eliminar') ? (
                    <div className="flex gap-1">
                      {hasPerm('plantillas', 'editar') && (
                        <Button variant="ghost" size="sm" onClick={() => { setEditingItem(plantilla); setFormData(plantilla); setIsDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPerm('plantillas', 'eliminar') && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(plantilla.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {plantilla.asunto && (
                  <div>
                    <span className="text-xs text-[#6B7280] font-medium">Asunto:</span>
                    <p className="text-sm mt-1">{plantilla.asunto}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-[#6B7280] font-medium">Contenido:</span>
                  <p className="text-sm mt-1 line-clamp-3">{plantilla.contenido}</p>
                </div>
                <div>
                  <span className="text-xs text-[#6B7280] font-medium">Variables:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {plantilla.variables_disponibles.map((varia, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {varia}
                      </Badge>
                    ))}
                  </div>
                </div>
                {plantilla.activa ? (
                  <Badge className="bg-green-500">Activa</Badge>
                ) : (
                  <Badge variant="outline">Inactiva</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Plantilla" : "Nueva Plantilla"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-[#111827]">Nombre</label>
                <Input
                  value={formData.nombre || ""}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre de la plantilla"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#111827]">Tipo</label>
                <select
                  value={formData.tipo || "email"}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  className="w-full h-10 px-3 border border-[#D1D5DB] rounded-md"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="push">Push</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#111827]">Categoría</label>
                <Input
                  value={formData.categoria || ""}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ej: recordatorio"
                />
              </div>
            </div>

            {formData.tipo === "email" && (
              <div>
                <label className="text-sm font-medium text-[#111827]">Asunto</label>
                <Input
                  value={formData.asunto || ""}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  placeholder="Asunto del email"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-[#111827]">
                Contenido <span className="text-xs text-[#6B7280]">(Puedes usar variables como {`{{nombre}}`}, {`{{fecha}}`})</span>
              </label>
              <Textarea
                value={formData.contenido || ""}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                placeholder="Contenido del mensaje..."
                rows={8}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.activa}
                onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
              />
              <span className="text-sm text-[#6B7280]">Plantilla activa</span>
            </div>

            <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
              <h4 className="text-sm font-medium text-[#111827] mb-2">Variables disponibles:</h4>
              <p className="text-xs text-[#6B7280]">
                nombre, fecha, hora, sede, direccion, codigo, numero, tiempo, motivo
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <CheckCircle className="h-4 w-4 mr-2" />
                {editingItem ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
