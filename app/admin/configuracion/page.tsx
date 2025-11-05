"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, Bell, Mail, Globe, Shield, Briefcase, FileText, Plug, Sliders, Zap, ClipboardList } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useToasts } from "@/lib/hooks/use-toast";
import { getConfiguracionValue, setConfiguracion } from "@/lib/actions/database";
import ServiciosView from "../servicios/page";
import RolesPermisosView from "../roles-permisos/page";
import PlantillasView from "../plantillas/page";

export default function ConfiguracionPage() {
  const [checkinMinimo, setCheckinMinimo] = useState("15");
  const [checkinMaximo, setCheckinMaximo] = useState("60");
  const { success, error } = useToasts();

  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        // Intentar cargar desde Supabase
        const minimo = await getConfiguracionValue('checkin_ventana_minima', 15);
        const maximo = await getConfiguracionValue('checkin_ventana_maxima', 60);
        setCheckinMinimo(String(minimo));
        setCheckinMaximo(String(maximo));
      } catch (err) {
        console.error("Error cargando configuración:", err);
      }
    };
    cargarConfiguracion();
  }, []);

  const handleGuardarCheckin = async () => {
    try {
      await Promise.all([
        setConfiguracion('checkin_ventana_minima', checkinMinimo, 'number', 'Minutos antes de la cita para permitir check-in'),
        setConfiguracion('checkin_ventana_maxima', checkinMaximo, 'number', 'Minutos antes de la cita máxima para check-in')
      ]);
      success("Guardado", "Configuración de check-in actualizada en la base de datos");
    } catch (err: any) {
      error("Error", "No se pudo guardar la configuración");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0">
          <h1 className="text-3xl font-bold text-foreground font-sans mb-2">Configuración</h1>
          <p className="text-sm text-muted-foreground font-sans">Gestión completa del sistema</p>
        </div>
      </div>

      {/* Primera fila de tabs */}
      <Tabs defaultValue="servicios" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="servicios" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Servicios
          </TabsTrigger>
          <TabsTrigger value="roles-permisos" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles y Permisos
          </TabsTrigger>
          <TabsTrigger value="plantillas" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="integraciones" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Integraciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servicios" className="space-y-4">
          <ServiciosView />
        </TabsContent>

        <TabsContent value="roles-permisos" className="space-y-4">
          <RolesPermisosView />
        </TabsContent>

        <TabsContent value="plantillas" className="space-y-4">
          <PlantillasView />
        </TabsContent>

        <TabsContent value="integraciones" className="space-y-4">
          <Card className="border border-[#E5E7EB] shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plug className="h-5 w-5 text-[#16A34A]" />
                <CardTitle>Integraciones</CardTitle>
              </div>
              <CardDescription>Conecta con sistemas externos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-[#E5E7EB] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">HIS (Sistema de Información Hospitalaria)</h3>
                    <p className="text-sm text-muted-foreground">Integración con historial clínico</p>
                  </div>
                  <Badge variant="outline">No configurado</Badge>
                </div>
              </div>
              <div className="border border-[#E5E7EB] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">ERP</h3>
                    <p className="text-sm text-muted-foreground">Integración con sistema contable</p>
                  </div>
                  <Badge variant="outline">No configurado</Badge>
                </div>
              </div>
              <div className="border border-[#E5E7EB] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">CRM</h3>
                    <p className="text-sm text-muted-foreground">Gestión de relaciones con clientes</p>
                  </div>
                  <Badge variant="outline">No configurado</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Segunda fila de tabs */}
      <Tabs defaultValue="parametros" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parametros" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Parámetros del Sistema
          </TabsTrigger>
          <TabsTrigger value="automatizaciones" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automatizaciones
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Auditoría
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parametros" className="space-y-4">
          <Card className="border border-[#E5E7EB] shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-[#16A34A]" />
                <CardTitle>Parámetros del Sistema</CardTitle>
              </div>
              <CardDescription>Ajustes generales del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Zona Horaria</label>
                <select className="w-full h-10 px-3 border border-input rounded-md bg-background">
                  <option>America/Lima (GMT-5)</option>
                  <option>America/Mexico_City (GMT-6)</option>
                  <option>America/Bogota (GMT-5)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Idioma</label>
                <select className="w-full h-10 px-3 border border-input rounded-md bg-background">
                  <option>Español</option>
                  <option>English</option>
                </select>
              </div>
              </div>
              <Separator />
              <h3 className="font-semibold">Ventanas de Check-in</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Ventana Mínima (minutos antes)</label>
                  <Input 
                    type="number" 
                    value={checkinMinimo}
                    onChange={(e) => setCheckinMinimo(e.target.value)}
                    placeholder="15" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Ventana Máxima (minutos antes)</label>
                  <Input 
                    type="number" 
                    value={checkinMaximo}
                    onChange={(e) => setCheckinMaximo(e.target.value)}
                    placeholder="60" 
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleGuardarCheckin}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </Button>
              </div>
              <Separator />
              <h3 className="font-semibold">SLA por Servicio (Tiempo Objetivo)</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg">
                  <div>
                    <p className="font-medium">Consulta General</p>
                    <p className="text-sm text-muted-foreground">Servicio rápido</p>
                  </div>
                  <Badge variant="outline">15 min</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg">
                  <div>
                    <p className="font-medium">Consulta Especializada</p>
                    <p className="text-sm text-muted-foreground">Servicio estándar</p>
                  </div>
                  <Badge variant="outline">30 min</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg">
              <div>
                    <p className="font-medium">Procedimientos</p>
                    <p className="text-sm text-muted-foreground">Servicio extendido</p>
                  </div>
                  <Badge variant="outline">60 min</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automatizaciones" className="space-y-4">
          <Card className="border border-[#E5E7EB] shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#16A34A]" />
                <CardTitle>Automatizaciones</CardTitle>
              </div>
              <CardDescription>Configura reglas y flujos automáticos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg">
                <div>
                  <h3 className="font-semibold">Recordatorio de cita</h3>
                  <p className="text-sm text-muted-foreground">Enviar 24h antes de la cita</p>
                </div>
                <Badge variant="success">Activo</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg">
                <div>
                  <h3 className="font-semibold">Confirmación automática</h3>
                  <p className="text-sm text-muted-foreground">Confirmar citas nuevas automáticamente</p>
                </div>
                <Badge variant="secondary">Inactivo</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Envío Automático de Reportes */}
          <Card className="border border-[#E5E7EB] shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#16A34A]" />
                <CardTitle>Envío Automático de Reportes</CardTitle>
              </div>
              <CardDescription>Configura reportes que se envíen automáticamente por email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">Reporte Diario</h3>
                    <p className="text-sm text-muted-foreground">Envía resumen diario a administradores</p>
                    <Input 
                      type="email" 
                      placeholder="admin@reservaflow.com" 
                      defaultValue="admin@reservaflow.com"
                      className="mt-2"
                    />
                  </div>
                  <Badge variant="success" className="ml-4">Activo</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">Reporte Semanal</h3>
                    <p className="text-sm text-muted-foreground">Envía cada lunes a las 9:00 AM</p>
                    <Input 
                      type="email" 
                      placeholder="manager@reservaflow.com" 
                      className="mt-2"
                    />
                  </div>
                  <Badge variant="secondary">Inactivo</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border border-[#E5E7EB] rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">Reporte Mensual</h3>
                    <p className="text-sm text-muted-foreground">Envía el primer día de cada mes</p>
                    <Input 
                      type="email" 
                      placeholder="director@reservaflow.com" 
                      className="mt-2"
                    />
                  </div>
                  <Badge variant="secondary">Inactivo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4">
          <Card className="border border-[#E5E7EB] shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-[#16A34A]" />
                <CardTitle>Auditoría</CardTitle>
              </div>
              <CardDescription>Registro de acciones del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Estadísticas de Logs QR */}
                <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
                  <h4 className="font-semibold mb-3">Logs de Check-in QR</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold">1,245</p>
                      <p className="text-sm text-muted-foreground">Check-ins exitosos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">23</p>
                      <p className="text-sm text-muted-foreground">QR inválidos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">QR duplicados</p>
                    </div>
                  </div>
                </div>

                {/* Acciones recientes */}
                <div>
                  <h4 className="font-semibold mb-3">Acciones Recientes</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Check-in realizado</p>
                          <p className="text-xs text-muted-foreground">Cita CT-123456 • hace 5 minutos</p>
                        </div>
                      </div>
                      <Badge variant="success">Exitoso</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">QR inválido detectado</p>
                          <p className="text-xs text-muted-foreground">IP: 192.168.1.100 • hace 12 minutos</p>
                        </div>
                      </div>
                      <Badge variant="destructive">Fallido</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">Cita modificada</p>
                          <p className="text-xs text-muted-foreground">Por: Admin • hace 1 hora</p>
                        </div>
                      </div>
                      <Badge variant="outline">Modificación</Badge>
                    </div>
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Ver Todos los Logs
                  </Button>
                  <Button variant="outline" size="sm">
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
