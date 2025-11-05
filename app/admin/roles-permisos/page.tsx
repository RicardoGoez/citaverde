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
import { getRoles, createRol, updateRol, deleteRol, getPermisos, getPermisosDeRol, asignarPermisoARol, removerPermisoDeRol, createUsuario, getUsuarios } from "@/lib/actions/database";

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
  const [userFormData, setUserFormData] = useState({ nombre: "", email: "", password: "", role_id: "" });
  const { success: showSuccess, error: showError } = useToasts();

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
    cargarPermisos();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const data = await getUsuarios();
      // Filtrar solo usuarios con rol administrador o recepcionista
      const usuariosAdminRec = data.filter((u: any) => 
        u.role?.toLowerCase() === "administrador" || u.role?.toLowerCase() === "recepcionista"
      );
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
    
    // Buscar el rol del usuario
    const rolUsuario = roles.find(r => r.nombre.toLowerCase() === usuario.role.toLowerCase());
    
    if (!rolUsuario) {
      showError("Error", "No se encontró el rol del usuario");
      return;
    }

    try {
      const permisosDelRol = await getPermisosDeRol(rolUsuario.id);
      const permisosIds = permisosDelRol.map((p: any) => p.id);
      setSelectedPermisos(new Set(permisosIds));
    } catch (error) {
      console.error("Error cargando permisos del rol:", error);
      setSelectedPermisos(new Set());
    }
    setIsPermisosDialogOpen(true);
  };

  const handleTogglePermiso = async (permisoId: string) => {
    if (!selectedUsuario) return;
    
    const newSelectedPermisos = new Set(selectedPermisos);
    
    // Buscar el rol del usuario
    const rolUsuario = roles.find(r => r.nombre.toLowerCase() === selectedUsuario.role.toLowerCase());
    
    if (!rolUsuario) {
      showError("Error", "No se encontró el rol del usuario");
      return;
    }
    
    if (newSelectedPermisos.has(permisoId)) {
      // Remover permiso
      newSelectedPermisos.delete(permisoId);
      try {
        await removerPermisoDeRol(rolUsuario.id, permisoId);
        showSuccess("Éxito", "Permiso removido correctamente");
      } catch (error) {
        showError("Error", "Error al remover el permiso");
        return;
      }
    } else {
      // Agregar permiso
      newSelectedPermisos.add(permisoId);
      try {
        await asignarPermisoARol(rolUsuario.id, permisoId);
        showSuccess("Éxito", "Permiso asignado correctamente");
      } catch (error) {
        showError("Error", "Error al asignar el permiso");
        return;
      }
    }
    
    setSelectedPermisos(newSelectedPermisos);
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userFormData.nombre.trim() || !userFormData.email.trim() || !userFormData.password.trim() || !userFormData.role_id) {
      showError("Error", "Todos los campos son requeridos");
      return;
    }

    try {
      const selectedRole = roles.find(r => r.id === userFormData.role_id);
      const roleName = selectedRole?.nombre.toLowerCase();
      
      // Validar que el rol sea uno de los permitidos
      if (!roleName || (roleName !== "administrador" && roleName !== "recepcionista" && roleName !== "usuario")) {
        showError("Error", "Selecciona un rol válido");
        return;
      }

      await createUsuario({
        name: userFormData.nombre,
        email: userFormData.email,
        password: userFormData.password,
        role: roleName as "admin" | "recepcionista" | "usuario",
      });
      
      await cargarUsuarios();
      showSuccess("Éxito", "Usuario creado correctamente");
      setIsUserDialogOpen(false);
      setUserFormData({ nombre: "", email: "", password: "", role_id: "" });
    } catch (error) {
      console.error("Error creando usuario:", error);
      showError("Error", "Error al crear el usuario");
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
        <Button onClick={() => setIsUserDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      </div>

      {/* Grid de Usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usuarios.map((usuario) => (
          <Card key={usuario.id} className="border border-[#E5E7EB] shadow-sm hover:shadow transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{usuario.name}</CardTitle>
              </div>
              <CardDescription className="capitalize">{usuario.role}</CardDescription>
              <p className="text-sm text-gray-500 mt-1">{usuario.email}</p>
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
        ))}
      </div>

      {/* Dialog de Gestión de Permisos */}
      <Dialog open={isPermisosDialogOpen} onOpenChange={setIsPermisosDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestionar Permisos - {selectedUsuario?.name}</DialogTitle>
            <DialogDescription>
              Selecciona los permisos que tendrá este usuario en el sistema (Rol: {selectedUsuario?.role})
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
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea un nuevo usuario y asigna un rol (Administrador o Recepcionista)
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
              <label className="text-sm font-medium text-[#111827]">Contraseña *</label>
              <Input
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#111827]">Rol *</label>
              <select
                value={userFormData.role_id}
                onChange={(e) => setUserFormData({ ...userFormData, role_id: e.target.value })}
                className="w-full h-10 px-3 border border-input rounded-md bg-background"
                required
              >
                <option value="">Selecciona un rol</option>
                {roles
                  .filter(r => r.nombre.toLowerCase() !== "usuario")
                  .map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nombre}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
