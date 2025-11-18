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
import { Search, Filter, Calendar, CheckCircle2, XCircle, Clock, MoreVertical, Plus, Edit, Trash2, UserCheck, UserX, ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { getCitas, getUsuarios, getServicios, getProfesionales, getSedes, updateCita, deleteCita, createCita, getHorariosEspeciales, getDisponibilidades, getRecursos } from "@/lib/actions/database";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { getUserById } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { useToasts } from "@/lib/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSede } from "@/lib/hooks/use-sede";

export default function CitasPage() {
  const [citas, setCitas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [consultorios, setConsultorios] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCita, setEditingCita] = useState<any>(null);
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
  
  // Form state
  const [formData, setFormData] = useState({
    user_id: "",
    profesional_id: "",
    servicio: "",
    servicio_id: "",
    sede_id: "",
    fecha: "",
    hora: "",
    estado: "pendiente",
    notas: "",
    consultorio_id: "",
  });

  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [fechasBloqueadas, setFechasBloqueadas] = useState<string[]>([]);
  const [disponibilidadesDoctor, setDisponibilidadesDoctor] = useState<any[]>([]);
  const [mesActual, setMesActual] = useState(new Date());
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);

  const horasDisponibles = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30'
  ];

  // Nombres de mes y días
  const nombresMes = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  useEffect(() => {
    if (sedeSeleccionada && !formData.sede_id) {
      setFormData(prev => ({ ...prev, sede_id: sedeSeleccionada.id }));
    }
  }, [sedeSeleccionada]);

  // Cargar fechas bloqueadas (festivos) cuando se selecciona sede
  useEffect(() => {
    const loadFechasBloqueadas = async () => {
      if (!sedeSeleccionada) {
        setFechasBloqueadas([]);
        return;
      }

      try {
        const horariosEspeciales = await getHorariosEspeciales(sedeSeleccionada.id);
        const festivos = horariosEspeciales
          .filter((horario: any) => horario.es_festivo)
          .map((horario: any) => horario.fecha);
        setFechasBloqueadas(festivos);
      } catch (error) {
        console.error("Error cargando horarios especiales:", error);
        setFechasBloqueadas([]);
      }
    };

    loadFechasBloqueadas();
  }, [sedeSeleccionada]);

  // Cargar disponibilidades del doctor cuando se selecciona
  useEffect(() => {
    const loadDisponibilidades = async () => {
      if (!formData.profesional_id) {
        setDisponibilidadesDoctor([]);
        return;
      }

      try {
        const disponibilidades = await getDisponibilidades(formData.profesional_id);
        setDisponibilidadesDoctor(disponibilidades);
      } catch (error) {
        console.error("Error cargando disponibilidades:", error);
        setDisponibilidadesDoctor([]);
      }
    };

    loadDisponibilidades();
  }, [formData.profesional_id]);

  // Cargar horas ocupadas cuando se selecciona profesional y fecha
  useEffect(() => {
    const loadHorasOcupadas = async () => {
      if (!formData.profesional_id || !formData.fecha) {
        setHorasOcupadas([]);
        return;
      }

      try {
        const citasData = await getCitas();
        const citasFiltradas = citasData.filter((cita: any) => 
          cita.profesional_id === formData.profesional_id && 
          cita.fecha === formData.fecha &&
          cita.estado !== 'cancelada' &&
          (!isEditing || cita.id !== editingCita?.id)
        );
        const ocupadas = citasFiltradas.map((cita: any) => cita.hora);
        setHorasOcupadas(ocupadas);
      } catch (error) {
        console.error("Error cargando horas ocupadas:", error);
        setHorasOcupadas([]);
      }
    };

    loadHorasOcupadas();
  }, [formData.profesional_id, formData.fecha, isEditing, editingCita]);

  useEffect(() => {
    const loadData = async () => {
      if (!sedeSeleccionada) {
        setLoading(false);
        return;
      }

      try {
        const [citasData, usuariosData, serviciosData, profesionalesData, sedesData, recursosData] = await Promise.all([
          getCitas(),
          getUsuarios(),
          getServicios(sedeSeleccionada.id),
          getProfesionales(sedeSeleccionada.id),
          getSedes(),
          getRecursos(sedeSeleccionada.id)
        ]);
        // Filtrar citas por sede
        const citasFiltradas = citasData.filter((cita: any) => cita.sede_id === sedeSeleccionada.id);
        // Filtrar solo consultorios disponibles (excluir mantenimiento y inactivos)
        const consultoriosFiltrados = recursosData.filter((r: any) => 
          r.tipo === 'consultorio' && 
          r.is_active !== false && 
          r.estado !== 'mantenimiento'
        );
        setCitas(citasFiltradas);
        setUsuarios(usuariosData);
        setServicios(serviciosData);
        setProfesionales(profesionalesData);
        setSedes(sedesData);
        setConsultorios(consultoriosFiltrados);
      } catch (err) {
        console.error("Error cargando citas:", err);
        error("Error", "No se pudieron cargar las citas");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [sedeSeleccionada, error]);

  // Verificar si una fecha es válida (no es fin de semana ni festivo, y el doctor tiene disponibilidad)
  const isFechaValida = (fechaStr: string): boolean => {
    if (!fechaStr) return false;
    
    // Verificar si es festivo
    if (fechasBloqueadas.includes(fechaStr)) {
      return false;
    }

    // Crear fecha desde string en hora local (evitar problemas de zona horaria)
    const [año, mes, dia] = fechaStr.split('-').map(Number);
    const fecha = new Date(año, mes - 1, dia);
    fecha.setHours(0, 0, 0, 0);
    
    // Verificar que no sea hoy (no se pueden crear citas para el mismo día)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const [añoHoy, mesHoy, diaHoy] = [hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()];
    const fechaHoyStr = `${añoHoy}-${String(mesHoy).padStart(2, '0')}-${String(diaHoy).padStart(2, '0')}`;
    
    if (fechaStr === fechaHoyStr) {
      return false; // No se pueden crear citas para hoy
    }
    
    // Verificar que no sea pasado
    if (fecha < hoy) {
      return false;
    }
    
    const diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado
    if (diaSemana === 0 || diaSemana === 6) {
      return false;
    }

    // Verificar si el doctor tiene disponibilidad en ese día
    if (formData.profesional_id && disponibilidadesDoctor.length > 0) {
      // JavaScript getDay(): 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
      // BD usa el mismo formato: 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
      const tieneDisponibilidad = disponibilidadesDoctor.some((disp: any) => {
        // Solo considerar disponibilidades de tipo 'jornada'
        if (disp.tipo !== 'jornada') {
          return false;
        }
        
        // Si es recurrente, verificar si el día de la semana coincide
        if (disp.recurrente && disp.dia_semana !== undefined) {
          return disp.dia_semana === diaSemana;
        }
        
        // Para disponibilidades no recurrentes, verificar rango de fechas Y día de la semana
        if (disp.fecha_inicio && disp.fecha_fin && disp.dia_semana !== undefined) {
          // Crear fechas desde strings en hora local
          const [añoInicio, mesInicio, diaInicio] = disp.fecha_inicio.split('-').map(Number);
          const fechaInicio = new Date(añoInicio, mesInicio - 1, diaInicio);
          fechaInicio.setHours(0, 0, 0, 0);
          
          const [añoFin, mesFin, diaFin] = disp.fecha_fin.split('-').map(Number);
          const fechaFin = new Date(añoFin, mesFin - 1, diaFin);
          fechaFin.setHours(23, 59, 59, 999);
          
          // Verificar que la fecha esté en el rango Y que el día de la semana coincida
          return fecha >= fechaInicio && fecha <= fechaFin && disp.dia_semana === diaSemana;
        }
        
        return false;
      });
      
      return tieneDisponibilidad;
    }

    // Si no hay doctor seleccionado o no hay disponibilidades, permitir todos los días laborables
    return true;
  };

  // Generar días del calendario
  const generarDiasDelCalendario = () => {
    const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
    const diaInicial = primerDia.getDay();
    const diasEnMes = ultimoDia.getDate();
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Función helper para formatear fecha en formato YYYY-MM-DD sin problemas de zona horaria
    const formatearFecha = (fecha: Date): string => {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    };
    
    const dias = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < diaInicial; i++) {
      dias.push(null);
    }
    
    // Días del mes
    for (let i = 1; i <= diasEnMes; i++) {
      // Crear fecha en hora local (medianoche)
      const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), i);
      fecha.setHours(0, 0, 0, 0);
      
      // Formatear fecha sin convertir a UTC (usar hora local)
      const fechaStr = formatearFecha(fecha);
      const diaSemana = fecha.getDay();
      
      // Verificar si es pasado o es hoy (solo permitir día siguiente en adelante)
      const esHoy = fechaStr === formatearFecha(hoy);
      const esPasado = fecha < hoy;
      const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
      const esFestivo = fechasBloqueadas.includes(fechaStr);
      const tieneDisponibilidad = formData.profesional_id ? isFechaValida(fechaStr) : true;
      // IMPORTANTE: No se pueden crear citas para el mismo día, solo para el día siguiente en adelante
      const esValido = !esPasado && !esHoy && !esFinDeSemana && !esFestivo && tieneDisponibilidad;
      
      dias.push({
        dia: i,
        fechaStr,
        esPasado: esPasado || esHoy, // Incluir hoy como "pasado" para efectos de visualización
        esHoy, // Guardar si es hoy para referencia
        esFinDeSemana,
        esFestivo,
        tieneDisponibilidad,
        esValido
      });
    }
    
    return dias;
  };

  // Obtener horas disponibles según la disponibilidad del doctor y la hora actual
  const obtenerHorasDisponibles = (): string[] => {
    if (!formData.fecha) {
      return [];
    }

    // Crear fecha desde string en hora local (evitar problemas de zona horaria)
    const [año, mes, dia] = formData.fecha.split('-').map(Number);
    const fechaSeleccionada = new Date(año, mes - 1, dia);
    fechaSeleccionada.setHours(0, 0, 0, 0);
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Obtener fecha de mañana (día siguiente)
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);
    
    // Determinar si la fecha seleccionada es mañana
    const esManana = fechaSeleccionada.getTime() === manana.getTime();
    
    // Obtener hora actual
    const ahora = new Date();
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();
    const horaActualMinutos = horaActual * 60 + minutoActual;

    // Si hay profesional y disponibilidades, filtrar por disponibilidad del doctor
    let horasBase: string[] = [];
    
    if (formData.profesional_id && disponibilidadesDoctor.length > 0) {
      const diaSemana = fechaSeleccionada.getDay();

      // Buscar disponibilidad para este día
      const disponibilidadDelDia = disponibilidadesDoctor.find((disp: any) => {
        if (disp.tipo !== 'jornada') return false;
        
        if (disp.recurrente && disp.dia_semana !== undefined) {
          return disp.dia_semana === diaSemana;
        }
        
        if (disp.fecha_inicio && disp.fecha_fin && disp.dia_semana !== undefined) {
          const [añoInicio, mesInicio, diaInicio] = disp.fecha_inicio.split('-').map(Number);
          const fechaInicio = new Date(añoInicio, mesInicio - 1, diaInicio);
          fechaInicio.setHours(0, 0, 0, 0);
          
          const [añoFin, mesFin, diaFin] = disp.fecha_fin.split('-').map(Number);
          const fechaFin = new Date(añoFin, mesFin - 1, diaFin);
          fechaFin.setHours(23, 59, 59, 999);
          
          return fechaSeleccionada >= fechaInicio && fechaSeleccionada <= fechaFin && disp.dia_semana === diaSemana;
        }
        
        return false;
      });

      if (disponibilidadDelDia) {
        // Obtener horas de inicio y fin
        const horaInicio = disponibilidadDelDia.hora_inicio || '08:00';
        const horaFin = disponibilidadDelDia.hora_fin || '18:00';

        // Convertir horas a minutos desde medianoche
        const [horaInicioH, minutoInicioM] = horaInicio.split(':').map(Number);
        const minutosInicio = horaInicioH * 60 + minutoInicioM;
        
        const [horaFinH, minutoFinM] = horaFin.split(':').map(Number);
        const minutosFin = horaFinH * 60 + minutoFinM;

        // Generar horas disponibles en intervalos de 30 minutos
        let horaActualIter = minutosInicio;
        
        while (horaActualIter < minutosFin) {
          const horasNum = Math.floor(horaActualIter / 60);
          const minutosNum = horaActualIter % 60;
          const horaStr = `${String(horasNum).padStart(2, '0')}:${String(minutosNum).padStart(2, '0')}`;
          
          if (horasDisponibles.includes(horaStr)) {
            horasBase.push(horaStr);
          }
          horaActualIter += 30; // Intervalos de 30 minutos
        }
      } else {
        // Si no hay disponibilidad específica, usar todas las horas disponibles
        horasBase = [...horasDisponibles];
      }
    } else {
      // Si no hay profesional o no hay disponibilidades, usar todas las horas disponibles
      horasBase = [...horasDisponibles];
    }

    // Si la fecha seleccionada es mañana, filtrar horas según la hora actual
    if (esManana) {
      // Si ya son las 8 PM (20:00) o más tarde, no mostrar horas de la mañana (antes de las 14:00)
      if (horaActualMinutos >= 20 * 60) {
        // No mostrar horas antes de las 14:00 (solo mostrar tarde)
        horasBase = horasBase.filter((hora) => {
          const [horaH, minutoM] = hora.split(':').map(Number);
          const horaMinutos = horaH * 60 + minutoM;
          return horaMinutos >= 14 * 60; // Solo horas de 14:00 en adelante
        });
      }
    }

    // Filtrar horas ocupadas
    return horasBase.filter(hora => !horasOcupadas.includes(hora));
  };

  const handleOpenDialog = (cita?: any) => {
    if (cita) {
      setIsEditing(true);
      setEditingCita(cita);
      setFormData({
        user_id: cita.user_id,
        profesional_id: cita.profesional_id || "",
        servicio: cita.servicio || "",
        servicio_id: cita.servicio_id || "",
        sede_id: sedeSeleccionada?.id || "",
        fecha: cita.fecha,
        hora: cita.hora,
        estado: cita.estado,
        notas: cita.notas || cita.motivo || "",
        consultorio_id: cita.consultorio_id || "",
      });
      if (cita.fecha) {
        setMesActual(new Date(cita.fecha));
      }
    } else {
      setIsEditing(false);
      setEditingCita(null);
      const hoy = new Date().toISOString().split('T')[0];
      setFormData({
        user_id: "",
        profesional_id: "",
        servicio: "",
        servicio_id: "",
        sede_id: sedeSeleccionada?.id || "",
        fecha: "",
        hora: "",
        estado: "pendiente",
        notas: "",
        consultorio_id: "",
      });
      setMesActual(new Date());
    }
    setCalendarioAbierto(false); // Cerrar calendario al abrir/cerrar modal
    setIsDialogOpen(true);
  };

  const handleDelete = async (cita: any) => {
    // Verificar permiso
    const tienePermiso = await hasPermAsync('citas', 'eliminar');
    if (!tienePermiso) {
      error("Sin permisos", "No tienes permiso para eliminar citas. Este permiso puede haber sido removido.");
      return;
    }

    if (confirm(`¿Estás seguro de eliminar esta cita?`)) {
      try {
        await deleteCita(cita.id);
        // Recargar datos desde la BD
        const citasData = await getCitas();
        const citasFiltradas = citasData.filter((c: any) => c.sede_id === sedeSeleccionada?.id);
        setCitas(citasFiltradas);
        success("Eliminada", "Cita eliminada exitosamente");
      } catch (err) {
        console.error("Error eliminando cita:", err);
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
      
      // Recargar datos desde la BD
      const citasData = await getCitas();
      const citasFiltradas = citasData.filter((c: any) => c.sede_id === sedeSeleccionada?.id);
      setCitas(citasFiltradas);
      
      // Enviar email de encuesta al usuario
      try {
        const user = await getUserById(cita.user_id);
        if (user && user.email) {
          await NotificationService.notifyEncuestaCita(
            cita.user_id,
            {
              servicio: cita.servicio || 'Servicio',
              profesional: cita.profesional || 'Doctor',
              fecha: cita.fecha,
              hora: cita.hora,
              citaId: cita.id
            },
            user.email
          );
          console.log(`✅ Encuesta de satisfacción enviada a ${user.email}`);
        }
      } catch (notifError) {
        console.error("Error enviando encuesta:", notifError);
        // No fallar si el email falla
      }
      
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
      
      // Recargar datos desde la BD
      const citasData = await getCitas();
      const citasFiltradas = citasData.filter((c: any) => c.sede_id === sedeSeleccionada?.id);
      setCitas(citasFiltradas);
      
      success("Actualizado", "Cita marcada como no asistió");
    } catch (err) {
      error("Error", "No se pudo actualizar la cita");
    }
  };

  const handleSubmit = async () => {
    // Verificar permisos
    if (isEditing) {
      const tienePermiso = await hasPermAsync('citas', 'editar');
      if (!tienePermiso) {
        error("Sin permisos", "No tienes permiso para editar citas. Este permiso puede haber sido removido.");
        return;
      }
    } else {
      const tienePermiso = await hasPermAsync('citas', 'crear');
      if (!tienePermiso) {
        error("Sin permisos", "No tienes permiso para crear citas. Este permiso puede haber sido removido.");
        return;
      }
    }

    // Validaciones
    if (!formData.user_id || !formData.servicio_id || !formData.fecha || !formData.hora || !sedeSeleccionada) {
      error("Error", "Complete todos los campos requeridos");
      return;
    }

    // Validar que la fecha sea válida
    if (!isFechaValida(formData.fecha)) {
      error("Error", "No se pueden agendar citas para el mismo día, fines de semana, días festivos o días sin disponibilidad del doctor. Por favor, selecciona una fecha a partir de mañana.");
      return;
    }

    // Validar que la hora no esté ocupada
    if (formData.profesional_id && horasOcupadas.includes(formData.hora)) {
      error("Error", "Esta hora ya está ocupada. Por favor, selecciona otra hora.");
      return;
    }

    // Validar que la hora esté dentro del rango disponible del doctor
    if (formData.profesional_id) {
      const horasDisponiblesDelDia = obtenerHorasDisponibles();
      if (!horasDisponiblesDelDia.includes(formData.hora)) {
        error("Error", "Esta hora no está disponible para el doctor seleccionado.");
        return;
      }
    }

    try {
      const servicioEncontrado = servicios.find(s => s.id === formData.servicio_id);
      if (!servicioEncontrado) {
        error("Error", "Servicio no encontrado");
        return;
      }

      if (isEditing) {
        const profesionalEncontrado = profesionales.find(p => p.id === formData.profesional_id);
        const consultorioSeleccionado = consultorios.find(c => c.id === formData.consultorio_id);
        
        await updateCita(editingCita.id, {
          user_id: formData.user_id,
          profesional_id: formData.profesional_id || null,
          profesional: profesionalEncontrado?.name || null,
          consultorio_id: formData.consultorio_id || null,
          consultorio: consultorioSeleccionado?.name || null,
          servicio_id: formData.servicio_id,
          servicio: servicioEncontrado.name,
          sede_id: sedeSeleccionada.id,
          fecha: formData.fecha,
          hora: formData.hora,
          estado: formData.estado,
          motivo: formData.notas || null,
        });
        // Recargar datos desde la BD
        const citasData = await getCitas();
        const citasFiltradas = citasData.filter((c: any) => c.sede_id === sedeSeleccionada?.id);
        setCitas(citasFiltradas);
        success("Actualizada", "Cita actualizada exitosamente");
      } else {
        const profesionalEncontrado = profesionales.find(p => p.id === formData.profesional_id);
        
        // Buscar consultorio del profesional si está asignado
        let consultorioAsignado = null;
        if (formData.profesional_id) {
          const profesional = profesionales.find(p => p.id === formData.profesional_id);
          if (profesional?.consultorio_id) {
            consultorioAsignado = consultorios.find(c => c.id === profesional.consultorio_id);
          }
        }
        
        // Usar consultorio del formulario o el asignado al profesional
        const consultorioFinal = formData.consultorio_id 
          ? consultorios.find(c => c.id === formData.consultorio_id)
          : consultorioAsignado;

        const nuevaCita = await createCita({
          user_id: formData.user_id,
          sede_id: sedeSeleccionada.id,
          servicio_id: formData.servicio_id,
          servicio: servicioEncontrado.name,
          profesional_id: formData.profesional_id || undefined,
          profesional: profesionalEncontrado?.name || undefined,
          consultorio_id: consultorioFinal?.id || formData.consultorio_id || undefined,
          consultorio: consultorioFinal?.name || undefined,
          fecha: formData.fecha,
          hora: formData.hora,
          motivo: formData.notas || undefined,
          skipLimitValidation: false // Admin puede crear citas, pero debe respetar el límite por usuario
        });

        // Enviar email de confirmación con recordatorio
        try {
          const user = await getUserById(formData.user_id);
          if (user && user.email) {
            await NotificationService.notifyCitaConfirmada(
              formData.user_id,
              {
                servicio: servicioEncontrado.name,
                fecha: formData.fecha,
                hora: formData.hora,
                profesional: profesionalEncontrado?.name || '',
                id: nuevaCita.id,
                confirmationToken: nuevaCita.confirmationToken,
                qr_code: nuevaCita.qr_code
              },
              user.email
            );
            console.log(`✅ Email de confirmación enviado a ${user.email}`);
          } else {
            console.warn(`⚠️ Usuario ${formData.user_id} no tiene email configurado`);
          }
        } catch (emailError) {
          console.error("Error enviando email:", emailError);
          // No fallar la creación de cita si el email falla
        }

        // Recargar datos desde la BD
        const citasData = await getCitas();
        const citasFiltradas = citasData.filter((c: any) => c.sede_id === sedeSeleccionada?.id);
        setCitas(citasFiltradas);
        success("Creada", "Cita creada exitosamente y se ha enviado el recordatorio por correo");
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error guardando cita:", err);
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
                  <TableHead>Consultorio</TableHead>
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
                      {cita.consultorio ? (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          {cita.consultorio}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin asignar</span>
                      )}
                    </TableCell>
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
            {sedeSeleccionada && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Sede:</span> {sedeSeleccionada.name}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user_id">Paciente *</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.filter((u: any) => u.role === 'usuario').map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="servicio">Servicio *</Label>
                <Select
                  value={formData.servicio_id}
                  onValueChange={(value) => {
                    const servicioSeleccionado = servicios.find(s => s.id === value);
                    setFormData({ 
                      ...formData, 
                      servicio_id: value,
                      servicio: servicioSeleccionado?.name || "",
                      profesional_id: "" // Resetear profesional al cambiar servicio
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un servicio" />
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
                <Label htmlFor="profesional_id">Doctor</Label>
                <Select
                  value={formData.profesional_id}
                  onValueChange={(value) => {
                    const profesionalSeleccionado = profesionales.find(p => p.id === value);
                    // Buscar consultorio del doctor si está asignado
                    let consultorioAsignado = null;
                    if (profesionalSeleccionado?.consultorio_id) {
                      consultorioAsignado = consultorios.find(c => c.id === profesionalSeleccionado.consultorio_id);
                    }
                    setFormData({ 
                      ...formData, 
                      profesional_id: value, 
                      fecha: "", 
                      hora: "",
                      consultorio_id: consultorioAsignado?.id || ""
                    });
                  }}
                  disabled={!formData.servicio_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.servicio_id ? "Selecciona un doctor" : "Primero selecciona un servicio"} />
                  </SelectTrigger>
                  <SelectContent>
                    {profesionales.filter((prof: any) => {
                      if (!formData.servicio_id) return false;
                      // Filtrar profesionales que tienen el servicio seleccionado
                      const servicioSeleccionado = servicios.find(s => s.id === formData.servicio_id);
                      if (!servicioSeleccionado) return false;
                      // Verificar si el profesional tiene este servicio en su array de servicios
                      return prof.servicios && Array.isArray(prof.servicios) && prof.servicios.includes(servicioSeleccionado.name);
                    }).map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                      {prof.name}
                      </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="en_curso">En Curso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="consultorio">Consultorio</Label>
                <Select 
                  value={formData.consultorio_id || "none"} 
                  onValueChange={(value) => setFormData({ ...formData, consultorio_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.consultorio_id ? "Consultorio asignado" : "Seleccionar consultorio (opcional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin consultorio asignado</SelectItem>
                    {consultorios.map((consultorio) => (
                      <SelectItem key={consultorio.id} value={consultorio.id}>
                        {consultorio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.consultorio_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Consultorio: {consultorios.find(c => c.id === formData.consultorio_id)?.name}
                  </p>
                )}
              </div>
            </div>

            {/* Calendario */}
            {formData.profesional_id && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Fecha *</Label>
                  <div className="mt-1">
                    {/* Campo de fecha con botón para abrir calendario */}
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={formData.fecha ? new Date(formData.fecha).toLocaleDateString('es-ES', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        }) : ''}
                        readOnly
                        placeholder="Selecciona una fecha"
                        onClick={() => setCalendarioAbierto(!calendarioAbierto)}
                        className="cursor-pointer"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCalendarioAbierto(!calendarioAbierto)}
                        className="shrink-0"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Calendario desplegable */}
                    {calendarioAbierto && (
                      <div className="mt-2 border border-gray-200 rounded-lg p-2 bg-white shadow-lg z-10">
                        {/* Navegación del mes */}
                        <div className="flex items-center justify-between mb-2">
                          <button
                            type="button"
                            onClick={() => {
                              const nuevoMes = new Date(mesActual);
                              nuevoMes.setMonth(nuevoMes.getMonth() - 1);
                              setMesActual(nuevoMes);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {nombresMes[mesActual.getMonth()]} {mesActual.getFullYear()}
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              const nuevoMes = new Date(mesActual);
                              nuevoMes.setMonth(nuevoMes.getMonth() + 1);
                              setMesActual(nuevoMes);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                        {/* Días de la semana */}
                        <div className="grid grid-cols-7 gap-0.5 mb-1">
                          {diasSemana.map((dia) => (
                            <div key={dia} className="text-center text-[10px] font-medium text-gray-500 py-1">
                              {dia}
                            </div>
                          ))}
                        </div>
                        {/* Calendario */}
                        <div className="grid grid-cols-7 gap-0.5">
                          {generarDiasDelCalendario().map((dia, index) => {
                            if (dia === null) {
                              return <div key={index} className="h-7" />;
                            }
                            const estaSeleccionado = formData.fecha === dia.fechaStr;
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  if (dia.esValido) {
                                    setFormData({ ...formData, fecha: dia.fechaStr, hora: "" });
                                    setCalendarioAbierto(false); // Cerrar calendario al seleccionar
                                  }
                                }}
                                disabled={!dia.esValido}
                                className={`
                                  h-7 flex items-center justify-center text-xs rounded transition-all
                                  ${dia.esValido
                                    ? estaSeleccionado
                                      ? "bg-blue-600 text-white font-semibold shadow-sm"
                                      : "bg-white hover:bg-blue-50 text-gray-900 border border-gray-200 hover:border-blue-300"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  }
                                `}
                                title={dia.esFestivo ? 'Día festivo' : dia.esFinDeSemana ? 'Fin de semana' : dia.esHoy ? 'No se pueden crear citas para el mismo día' : dia.esPasado ? 'Fecha pasada' : !dia.tieneDisponibilidad ? 'Sin disponibilidad del doctor' : ''}
                              >
                                {dia.dia}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selector de horas */}
                {formData.fecha && (
                  <div>
                    <Label className="text-sm">Hora *</Label>
                    <div className="mt-1 grid grid-cols-5 gap-1.5 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                      {obtenerHorasDisponibles().map((hora) => {
                        const estaOcupada = horasOcupadas.includes(hora);
                        const estaSeleccionada = formData.hora === hora;
                        return (
                          <button
                            key={hora}
                            type="button"
                            onClick={() => {
                              if (!estaOcupada) {
                                setFormData({ ...formData, hora });
                              }
                            }}
                            disabled={estaOcupada}
                            className={`
                              px-2 py-1.5 rounded text-xs font-medium transition-all
                              ${estaOcupada
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                                : estaSeleccionada
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-900"
                              }
                            `}
                          >
                            {hora}
                          </button>
                        );
                      })}
                    </div>
                    {obtenerHorasDisponibles().length === 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        No hay horas disponibles para este día. Selecciona otro día.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mostrar fecha y hora si no hay doctor seleccionado */}
            {!formData.profesional_id && (
              <div className="grid grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                  <Label htmlFor="hora">Hora *</Label>
                <Input
                  id="hora"
                  type="time"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  required
                />
              </div>
              </div>
            )}

            <div>
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background min-h-[80px] mt-2"
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
