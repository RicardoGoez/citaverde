"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, Plus, Edit, Trash2, CheckCircle, UserPlus } from "lucide-react";
import { useToasts } from "@/lib/hooks/use-toast";
import { getRoles, createRol, updateRol, deleteRol, getPermisos, getPermisosDeRol, asignarPermisoARol, removerPermisoDeRol, createUsuario, getUsuarios, getOrCreateRolPorNombre, getSedes, updateUsuario } from "@/lib/actions/database";

interface Role {
  id: string;
  nombre: string;
  descripcion: string;
  nivel: number;
}

interface Permiso {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  sede_id?: string;
}

export default function RolesPermisosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermisosDialogOpen, setIsPermisosDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [selectedPermisos, setSelectedPermisos] = useState<Set<string>>(new Set());
  const [userFormData, setUserFormData] = useState({ nombre: "", email: "", password: "", role_id: "", sede_id: "" });
  const [sedes, setSedes] = useState<any[]>([]);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const { success: showSuccess, error: showError } = useToasts();

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
    cargarPermisos();
    cargarSedes();
  }, []);

  const cargarSedes = async () => {
    try {
      const data = await getSedes();
      setSedes(data);
    } catch (error) {
      console.error("Error cargando sedes:", error);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const data = await getUsuarios();
      // Filtrar solo usuarios con rol admin o recepcionista (case insensitive)
      const usuariosAdminRec = data.filter((u: any) => {
        const role = u.role?.toLowerCase();
        return role === "admin" || role === "administrador" || role === "recepcionista";
      });
      setUsuarios(usuariosAdminRec);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  const cargarPermisos = async () => {
    try {
      const data = await getPermisos();
      setPermisos(data as Permiso[]);
    } catch (error) {
      console.error("Error cargando permisos:", error);
    }
  };

  const handleOpenPermisosDialog = async (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    
    try {
      // Obtener o crear el rol correspondiente al usuario
      const rolUsuario = await getOrCreateRolPorNombre(usuario.role);
      
      // Recargar roles para asegurar que esté en la lista
      await cargarRoles();

      // Obtener permisos del rol
      const permisosDelRol = await getPermisosDeRol(rolUsuario.id);
      const permisosIds = permisosDelRol.map((p: any) => p.id).filter(Boolean);
      setSelectedPermisos(new Set(permisosIds));
      
      setIsPermisosDialogOpen(true);
    } catch (error) {
      console.error("Error abriendo diálogo de permisos:", error);
      showError("Error", "No se pudo cargar la información de permisos. Asegúrate de que exista un rol correspondiente.");
      setSelectedPermisos(new Set());
    }
  };

  const handleTogglePermiso = async (permisoId: string) => {
    if (!selectedUsuario) return;
    
    const newSelectedPermisos = new Set(selectedPermisos);
    
    try {
      // Obtener o crear el rol correspondiente al usuario
      const rolUsuario = await getOrCreateRolPorNombre(selectedUsuario.role);
      
      // Obtener información del permiso para el evento
      const permisoInfo = permisos.find(p => p.id === permisoId);
    
    if (newSelectedPermisos.has(permisoId)) {
      // Remover permiso
      newSelectedPermisos.delete(permisoId);
      try {
        await removerPermisoDeRol(rolUsuario.id, permisoId);
          showSuccess("Éxito", "Permiso removido correctamente. Los cambios ya están aplicados.");
          
          // Disparar evento para notificar que los permisos cambiaron
          window.dispatchEvent(new CustomEvent('permissionsChanged', {
            detail: { 
              role: selectedUsuario.role,
              action: 'removed',
              permiso: permisoInfo
            }
          }));
        } catch (error: any) {
          // Si el error es que no existe la relación, no es crítico
          if (error?.code !== 'PGRST116' && !error?.message?.includes('No rows')) {
            showError("Error", `Error al remover el permiso: ${error?.message || 'Error desconocido'}`);
        return;
          }
          showSuccess("Éxito", "Permiso removido correctamente");
          
          // Disparar evento incluso si ya estaba removido
          window.dispatchEvent(new CustomEvent('permissionsChanged', {
            detail: { 
              role: selectedUsuario.role,
              action: 'removed',
              permiso: permisoInfo
            }
          }));
      }
    } else {
      // Agregar permiso
      newSelectedPermisos.add(permisoId);
      try {
        await asignarPermisoARol(rolUsuario.id, permisoId);
          showSuccess("Éxito", "Permiso asignado correctamente. Los cambios ya están aplicados.");
          
          // Disparar evento para notificar que los permisos cambiaron
          window.dispatchEvent(new CustomEvent('permissionsChanged', {
            detail: { 
              role: selectedUsuario.role,
              action: 'added',
              permiso: permisoInfo
            }
          }));
        } catch (error: any) {
          // Si el error es que ya existe, no es crítico
          if (error?.code === '23505' || error?.message?.includes('duplicate')) {
            showSuccess("Éxito", "Permiso ya estaba asignado");
            
            // Disparar evento incluso si ya estaba asignado
            window.dispatchEvent(new CustomEvent('permissionsChanged', {
              detail: { 
                role: selectedUsuario.role,
                action: 'added',
                permiso: permisoInfo
              }
            }));
          } else {
            showError("Error", `Error al asignar el permiso: ${error?.message || 'Error desconocido'}`);
        return;
          }
      }
    }
    
    setSelectedPermisos(newSelectedPermisos);
      
      // Recargar los permisos del rol para asegurar sincronización
      const permisosDelRol = await getPermisosDeRol(rolUsuario.id);
      const permisosIds = permisosDelRol.map((p: any) => p.id).filter(Boolean);
      setSelectedPermisos(new Set(permisosIds));
    } catch (error: any) {
      console.error("Error en toggle permiso:", error);
      showError("Error", `Error al gestionar el permiso: ${error?.message || 'Error desconocido'}`);
    }
  };

  const cargarRoles = async () => {
    setLoading(true);
    try {
      const data = await getRoles();
      setRoles(data as Role[]);
    } catch (error) {
      console.error("Error cargando roles:", error);
      showError("Error", "No se pudieron cargar los roles");
      // Fallback a datos mock si falla
      const mockRoles: Role[] = [
        { id: "r1", nombre: "Administrador Total", descripcion: "Acceso completo al sistema", nivel: 10 },
        { id: "r2", nombre: "Gerente", descripcion: "Gestión de operaciones", nivel: 8 },
      ];
      setRoles(mockRoles);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenUserDialog = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setUserFormData({
        nombre: usuario.name,
        email: usuario.email,
        password: "", // No mostrar contraseña
        role_id: roles.find(r => r.nombre.toLowerCase() === usuario.role.toLowerCase())?.id || "",
        sede_id: usuario.sede_id || ""
      });
    } else {
      setEditingUsuario(null);
      setUserFormData({ nombre: "", email: "", password: "", role_id: "", sede_id: "" });
    }
    setIsUserDialogOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userFormData.nombre.trim() || !userFormData.email.trim() || !userFormData.role_id) {
      showError("Error", "Todos los campos son requeridos");
      return;
    }

    // Si es recepcionista, la sede es requerida
      const selectedRole = roles.find(r => r.id === userFormData.role_id);
    if (!selectedRole) {
      showError("Error", "Selecciona un rol válido");
      return;
    }

    const roleName = selectedRole.nombre.toLowerCase();
    if (roleName === "recepcionista" && !userFormData.sede_id) {
      showError("Error", "La sede es requerida para recepcionistas");
      return;
    }

    // Si es creación, la contraseña es requerida
    if (!editingUsuario && !userFormData.password.trim()) {
      showError("Error", "La contraseña es requerida");
      return;
    }
    
    try {
      // Normalizar el nombre del rol
      let roleNormalized: 'admin' | 'recepcionista';
      if (roleName === "admin" || roleName === "administrador") {
        roleNormalized = "admin";
      } else if (roleName === "recepcionista") {
        roleNormalized = "recepcionista";
      } else {
        showError("Error", "Solo se pueden crear usuarios con rol Administrador o Recepcionista desde esta interfaz");
        return;
      }

      if (editingUsuario) {
        // Actualizar usuario existente
        const usuarioActualizado = await updateUsuario(editingUsuario.id, {
          name: userFormData.nombre,
          email: userFormData.email,
          role: roleNormalized,
          sede_id: roleNormalized === "recepcionista" ? userFormData.sede_id : null,
          password: userFormData.password.trim() || undefined // Solo actualizar si se proporciona
        });
        
        // SIEMPRE notificar a TODAS las pestañas usando BroadcastChannel
        // Esto permite que el recepcionista reciba la actualización incluso si está en otra pestaña
        try {
          console.log("📢 Enviando actualización de usuario via BroadcastChannel:", {
            userId: editingUsuario.id,
            sede_id: usuarioActualizado.sede_id,
            name: usuarioActualizado.name
          });
          const channel = new BroadcastChannel('user-updates');
          channel.postMessage({
            type: 'userUpdated',
            userId: editingUsuario.id,
            updates: {
              sede_id: usuarioActualizado.sede_id,
              name: usuarioActualizado.name,
              email: usuarioActualizado.email,
              role: usuarioActualizado.role
            }
          });
          console.log("✅ Mensaje enviado via BroadcastChannel a todas las pestañas");
          // Cerrar el canal después de un breve delay para asegurar que el mensaje se envíe
          setTimeout(() => {
            channel.close();
          }, 500);
        } catch (error) {
          console.error("❌ Error usando BroadcastChannel:", error);
        }
        
        // Si el usuario actualizado es el que está logueado en ESTA pestaña, actualizar sessionStorage local
        const userStr = sessionStorage.getItem("user");
        if (userStr) {
          try {
            const usuarioLogueado = JSON.parse(userStr);
            if (usuarioLogueado.id === editingUsuario.id) {
              console.log("🔄 Actualizando sessionStorage local (misma pestaña)");
              // Actualizar sessionStorage con los datos actualizados
              const usuarioActualizadoCompleto = {
                ...usuarioLogueado,
                name: usuarioActualizado.name,
                email: usuarioActualizado.email,
                role: usuarioActualizado.role,
                sede_id: usuarioActualizado.sede_id,
              };
              sessionStorage.setItem("user", JSON.stringify(usuarioActualizadoCompleto));
              
              // Disparar evento local para que use-sede recargue la sede (misma pestaña)
              window.dispatchEvent(new CustomEvent('userSedeChanged', {
                detail: { sede_id: usuarioActualizado.sede_id }
              }));
            }
          } catch (error) {
            console.error("Error actualizando sessionStorage:", error);
          }
        }
        
        await cargarUsuarios();
        showSuccess("Éxito", "Usuario actualizado correctamente");
      } else {
        // Crear nuevo usuario
        const userId = crypto.randomUUID();

      await createUsuario({
          id: userId,
        name: userFormData.nombre,
        email: userFormData.email,
        password: userFormData.password,
          role: roleNormalized as "admin" | "recepcionista",
          sede_id: roleNormalized === "recepcionista" ? userFormData.sede_id : undefined,
          email_verificado: true,
      });
      
      await cargarUsuarios();
      showSuccess("Éxito", "Usuario creado correctamente");
      }
      
      setIsUserDialogOpen(false);
      setEditingUsuario(null);
      setUserFormData({ nombre: "", email: "", password: "", role_id: "", sede_id: "" });
    } catch (error: any) {
      console.error("Error guardando usuario:", error);
      const errorMessage = error?.message || error?.details || JSON.stringify(error);
      showError("Error", `Error al guardar el usuario: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#111827]">Roles y Permisos</h1>
          <p className="text-[#6B7280] mt-1">Gestiona roles y permisos del sistema</p>
        </div>
        <Button onClick={() => handleOpenUserDialog()}>
          <UserPlus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      </div>

      {/* Grid de Usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usuarios.map((usuario) => {
          const sedeUsuario = sedes.find(s => s.id === usuario.sede_id);
          return (
          <Card key={usuario.id} className="border border-[#E5E7EB] shadow-sm hover:shadow transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{usuario.name}</CardTitle>
                  {usuario.email.toLowerCase() !== "admin@citavede.com" && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenUserDialog(usuario)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
              </div>
                <CardDescription className="capitalize">
                  {usuario.role === 'admin' ? 'Administrador' : usuario.role === 'recepcionista' ? 'Recepcionista' : usuario.role}
                </CardDescription>
              <p className="text-sm text-gray-500 mt-1">{usuario.email}</p>
                {usuario.role === 'recepcionista' && sedeUsuario && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    Sede: {sedeUsuario.name}
                  </p>
                )}
            </CardHeader>
            <CardContent>
              {usuario.email.toLowerCase() !== "admin@citavede.com" ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleOpenPermisosDialog(usuario)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Gestionar Permisos
                </Button>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Usuario protegido del sistema</p>
                </div>
              )}
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Dialog de Gestión de Permisos */}
      <Dialog open={isPermisosDialogOpen} onOpenChange={setIsPermisosDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Permisos - {selectedUsuario?.name}</DialogTitle>
            <DialogDescription>
              Selecciona los permisos que tendrá este usuario en el sistema (Rol: {selectedUsuario?.role === 'admin' ? 'Administrador' : selectedUsuario?.role === 'recepcionista' ? 'Recepcionista' : selectedUsuario?.role})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {permisos.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay permisos disponibles</p>
            ) : (
              permisos.map((permiso) => (
                <div
                  key={permiso.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPermisos.has(permiso.id)
                      ? "border-[#16A34A] bg-[#F0FDF4]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleTogglePermiso(permiso.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedPermisos.has(permiso.id)
                          ? "border-[#16A34A] bg-[#16A34A]"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedPermisos.has(permiso.id) && (
                        <CheckCircle className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#111827]">{permiso.nombre}</h4>
                      <p className="text-sm text-[#6B7280] mt-1">{permiso.descripcion}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsPermisosDialogOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Crear Usuario */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUsuario ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
            <DialogDescription>
              {editingUsuario 
                ? "Edita la información del usuario y su rol" 
                : "Crea un nuevo usuario y asigna un rol (Administrador o Recepcionista)"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#111827]">Nombre Completo *</label>
              <Input
                value={userFormData.nombre}
                onChange={(e) => setUserFormData({ ...userFormData, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#111827]">Correo Electrónico *</label>
              <Input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#111827]">
                Contraseña {editingUsuario ? "(dejar vacío para no cambiar)" : "*"}
              </label>
              <Input
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                placeholder={editingUsuario ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                required={!editingUsuario}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#111827]">Rol *</label>
              <select
                value={userFormData.role_id}
                onChange={(e) => {
                  const newRoleId = e.target.value;
                  setUserFormData({ 
                    ...userFormData, 
                    role_id: newRoleId,
                    sede_id: "" // Limpiar sede si cambia el rol
                  });
                }}
                className="w-full h-10 px-3 border border-input rounded-md bg-background"
                required
              >
                <option value="">Selecciona un rol</option>
                {roles
                  .filter(r => {
                    const roleName = r.nombre.toLowerCase();
                    return roleName === "admin" || roleName === "administrador" || roleName === "recepcionista";
                  })
                  .map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nombre}
                    </option>
                  ))}
              </select>
            </div>
            {userFormData.role_id && roles.find(r => r.id === userFormData.role_id)?.nombre.toLowerCase() === "recepcionista" && (
              <div>
                <label className="text-sm font-medium text-[#111827]">Sede *</label>
                <select
                  value={userFormData.sede_id}
                  onChange={(e) => setUserFormData({ ...userFormData, sede_id: e.target.value })}
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
                <p className="text-xs text-gray-500 mt-1">
                  Los recepcionistas deben tener una sede asignada
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => {
                setIsUserDialogOpen(false);
                setEditingUsuario(null);
                setUserFormData({ nombre: "", email: "", password: "", role_id: "", sede_id: "" });
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingUsuario ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

