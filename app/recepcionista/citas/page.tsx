"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search,
  Plus,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Clock,
  QrCode,
  X,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { getCitas, createCita, getServicios, getProfesionales, updateCita, deleteCita, getHorariosEspeciales, getDisponibilidades, getUsuarios } from "@/lib/actions/database";
import { getUserById } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notifications";
import { useState, useEffect } from "react";
import { useToasts } from "@/lib/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSede } from "@/lib/hooks/use-sede";

export default function CitasRecepcionista() {
  const [citas, setCitas] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCita, setEditingCita] = useState<any>(null);
  const [filtroFecha, setFiltroFecha] = useState<'hoy' | 'proximas' | 'todas'>('todas');
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [fechasBloqueadas, setFechasBloqueadas] = useState<string[]>([]);
  const [disponibilidadesDoctor, setDisponibilidadesDoctor] = useState<any[]>([]);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [mesActual, setMesActual] = useState(new Date());
  const { success, error } = useToasts();

  const [formData, setFormData] = useState({
    paciente: "",
    servicio: "",
    profesional: "",
    fecha: "",
    hora: ""
  });

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

  const { sedeSeleccionada } = useSede();

  useEffect(() => {
    const loadData = async () => {
      if (!sedeSeleccionada) {
        setLoading(false);
        return;
      }

      try {
        const [citasData, serviciosData, profesionalesData] = await Promise.all([
          getCitas(),
          getServicios(sedeSeleccionada.id),
          getProfesionales(sedeSeleccionada.id)
        ]);
        // Filtrar citas por sede
        const citasFiltradas = citasData.filter((cita: any) => cita.sede_id === sedeSeleccionada.id);
        setCitas(citasFiltradas);
        setServicios(serviciosData);
        setProfesionales(profesionalesData);
      } catch (err) {
        console.error("Error cargando datos:", err);
        error("Error", "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
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
      if (!formData.profesional) {
        setDisponibilidadesDoctor([]);
        return;
      }

      try {
        const disponibilidades = await getDisponibilidades(formData.profesional);
        setDisponibilidadesDoctor(disponibilidades);
      } catch (error) {
        console.error("Error cargando disponibilidades:", error);
        setDisponibilidadesDoctor([]);
      }
    };

    loadDisponibilidades();
  }, [formData.profesional]);

  // Cargar horas ocupadas cuando se selecciona profesional y fecha
  useEffect(() => {
    const loadHorasOcupadas = async () => {
      if (!formData.profesional || !formData.fecha) {
        setHorasOcupadas([]);
        return;
      }

      try {
        const citasData = await getCitas();
        const citasFiltradas = citasData.filter((cita: any) => 
          cita.profesional_id === formData.profesional && 
          cita.fecha === formData.fecha &&
          cita.estado !== 'cancelada' &&
          (!isEditing || cita.id !== editingCita?.id) // Excluir la cita actual si estamos editando
        );
        const ocupadas = citasFiltradas.map((cita: any) => cita.hora);
        setHorasOcupadas(ocupadas);
      } catch (error) {
        console.error("Error cargando horas ocupadas:", error);
        setHorasOcupadas([]);
      }
    };

    loadHorasOcupadas();
  }, [formData.profesional, formData.fecha, isEditing, editingCita]);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const mañana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);
  
  // Filtrar citas según el filtro seleccionado
  let citasFiltradasPorFecha = citas;
  if (filtroFecha === 'hoy') {
    citasFiltradasPorFecha = citas.filter(c => {
      const fecha = new Date(c.fecha);
      return fecha >= hoy && fecha < mañana;
    });
  } else if (filtroFecha === 'proximas') {
    citasFiltradasPorFecha = citas.filter(c => {
      const fecha = new Date(c.fecha);
      return fecha >= hoy;
    });
  }
  // Si es 'todas', no filtrar por fecha
  
  const citasHoy = citas.filter(c => {
    const fecha = new Date(c.fecha);
    return fecha >= hoy && fecha < mañana;
  });

  const citasFiltradas = citasFiltradasPorFecha.filter(cita => {
    const search = searchTerm.toLowerCase();
    return (
      (cita.paciente_name || cita.user_name || '').toLowerCase().includes(search) ||
      (cita.servicio || cita.servicio_name || '').toLowerCase().includes(search) ||
      (cita.profesional || cita.profesional_name || '').toLowerCase().includes(search)
    );
  }).sort((a, b) => {
    // Ordenar por fecha y luego por hora
    const fechaA = new Date(`${a.fecha} ${a.hora || '00:00'}`);
    const fechaB = new Date(`${b.fecha} ${b.hora || '00:00'}`);
    return fechaA.getTime() - fechaB.getTime();
  });

  // Verificar si una fecha es válida (no es fin de semana ni festivo, no es hoy, y el doctor tiene disponibilidad)
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
    if (formData.profesional && disponibilidadesDoctor.length > 0) {
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
      const tieneDisponibilidad = formData.profesional ? isFechaValida(fechaStr) : true;
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
    
    if (formData.profesional && disponibilidadesDoctor.length > 0) {
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
        paciente: cita.paciente_name || cita.user_name || "",
        servicio: cita.servicio_id || "",
        profesional: cita.profesional_id || "",
        fecha: cita.fecha || "",
        hora: cita.hora || ""
      });
      if (cita.fecha) {
        setMesActual(new Date(cita.fecha));
      }
    } else {
      setIsEditing(false);
      setEditingCita(null);
      setFormData({
        paciente: "",
        servicio: "",
        profesional: "",
        fecha: "",
        hora: ""
      });
      setMesActual(new Date());
    }
    setCalendarioAbierto(false); // Cerrar calendario al abrir/cerrar modal
    setIsDialogOpen(true);
  };

  const handleCreateCita = async () => {
    if (!formData.paciente || !formData.servicio || !formData.fecha || !formData.hora || !sedeSeleccionada) {
      error("Error", "Complete todos los campos requeridos");
      return;
    }

    // Validar que la fecha sea válida
    if (!isFechaValida(formData.fecha)) {
      error("Error", "No se pueden agendar citas en fines de semana, días festivos o días sin disponibilidad del doctor.");
      return;
    }

    // Validar que la hora no esté ocupada
    if (horasOcupadas.includes(formData.hora)) {
      error("Error", "Esta hora ya está ocupada. Por favor, selecciona otra hora.");
      return;
    }

    // Validar que la hora esté dentro del rango disponible del doctor
    const horasDisponiblesDelDia = obtenerHorasDisponibles();
    if (formData.profesional && !horasDisponiblesDelDia.includes(formData.hora)) {
      error("Error", "Esta hora no está disponible para el doctor seleccionado.");
      return;
    }

    try {
      const servicioSeleccionado = servicios.find(s => s.id === formData.servicio);
      const profesionalSeleccionado = profesionales.find(p => p.id === formData.profesional);

      if (isEditing && editingCita) {
        // Actualizar cita existente
        await updateCita(editingCita.id, {
          servicio_id: formData.servicio,
          servicio: servicioSeleccionado?.name || '',
          profesional_id: formData.profesional || null,
          profesional: profesionalSeleccionado?.name || null,
          fecha: formData.fecha,
          hora: formData.hora,
          paciente_name: formData.paciente
        });
        
        // Recargar citas
        const citasData = await getCitas();
        const citasFiltradas = citasData.filter((cita: any) => cita.sede_id === sedeSeleccionada.id);
        setCitas(citasFiltradas);
        
        success("Éxito", "Cita actualizada correctamente");
      } else {
        // Buscar usuario por nombre del paciente (si existe)
        let usuarioEncontrado = null;
        let emailPaciente = null;
        let userIdParaCita = 'e0e0e0e0-0000-0000-0000-000000000003'; // Usuario genérico por defecto
        
        if (formData.paciente) {
          try {
            const todosUsuarios = await getUsuarios();
            // Buscar usuario por nombre (búsqueda parcial, case-insensitive)
            usuarioEncontrado = todosUsuarios.find((u: any) => 
              u.name && u.name.toLowerCase().trim() === formData.paciente.toLowerCase().trim()
            );
            
            if (usuarioEncontrado) {
              userIdParaCita = usuarioEncontrado.id;
              emailPaciente = usuarioEncontrado.email;
              console.log(`✅ Usuario encontrado: ${usuarioEncontrado.name} (${usuarioEncontrado.email})`);
            } else {
              console.log(`⚠️ Usuario no encontrado para: ${formData.paciente}`);
            }
          } catch (error) {
            console.error("Error buscando usuario:", error);
          }
        }

        // Crear nueva cita
      const nuevaCita = await createCita({
          user_id: userIdParaCita,
        servicio_id: formData.servicio,
        servicio: servicioSeleccionado?.name || '',
        profesional_id: formData.profesional || '',
        profesional: profesionalSeleccionado?.name || '',
          sede_id: sedeSeleccionada.id,
        fecha: formData.fecha,
          hora: formData.hora,
          paciente_name: formData.paciente // Guardar el nombre del paciente
      });

        // Enviar email de confirmación con recordatorio (si el usuario tiene email)
        if (emailPaciente) {
      try {
        await NotificationService.notifyCitaConfirmada(
              userIdParaCita,
          {
            servicio: servicioSeleccionado?.name || '',
            fecha: formData.fecha,
            hora: formData.hora,
            profesional: profesionalSeleccionado?.name || '',
            id: nuevaCita.id,
            confirmationToken: nuevaCita.confirmationToken,
            qr_code: nuevaCita.qr_code
          },
              emailPaciente
        );
            console.log(`✅ Email de confirmación enviado a ${emailPaciente}`);
      } catch (emailError) {
        console.error("Error enviando email:", emailError);
        // No fallar la creación de cita si el email falla
          }
        } else {
          console.warn(`⚠️ No se pudo enviar email: Usuario "${formData.paciente}" no tiene email registrado`);
      }

      // Recargar citas
      const citasData = await getCitas();
        const citasFiltradas = citasData.filter((cita: any) => cita.sede_id === sedeSeleccionada.id);
        setCitas(citasFiltradas);

      success("Éxito", emailPaciente ? "Cita creada correctamente y se ha enviado el recordatorio por correo" : "Cita creada correctamente (no se pudo enviar correo: usuario no encontrado o sin email)");
      }
      
      setIsDialogOpen(false);
      setFormData({
        paciente: "",
        servicio: "",
        profesional: "",
        fecha: "",
        hora: ""
      });
    } catch (err: any) {
      console.error("Error creando cita:", err);
      error("Error", err.message || "No se pudo crear la cita");
    }
  };

  const handleCheckIn = async (cita: any) => {
    try {
      await updateCita(cita.id, { 
        estado: 'en_curso',
        hora_checkin: new Date().toISOString()
      });
      
      // Notificar al usuario del check-in
      try {
        const user = await getUserById(cita.user_id);
        if (user && user.email) {
          await NotificationService.notifyCheckInCita(
            cita.user_id,
            {
              servicio: cita.servicio || 'Servicio',
              fecha: cita.fecha,
              hora: cita.hora,
              profesional: cita.profesional
            },
            user.email
          );
          console.log(`✅ Notificación de check-in enviada a ${user.email}`);
        }
      } catch (notifError) {
        console.error("Error enviando notificación:", notifError);
        // No fallar si la notificación falla
      }
      
      // Recargar citas
      const citasData = await getCitas();
      const citasFiltradas = citasData.filter((c: any) => c.sede_id === sedeSeleccionada?.id);
      setCitas(citasFiltradas);
      
      success("Check-in", `Check-in realizado`);
    } catch (err: any) {
      console.error("Error en check-in:", err);
      error("Error", err.message || "No se pudo realizar check-in");
    }
  };

  const handleCancel = async (cita: any) => {
    try {
      await updateCita(cita.id, { estado: 'cancelada' });
      
      // Recargar citas
      const citasData = await getCitas();
      const citasFiltradas = citasData.filter((c: any) => c.sede_id === sedeSeleccionada?.id);
      setCitas(citasFiltradas);
      
      success("Cancelada", `Cita cancelada`);
    } catch (err: any) {
      console.error("Error cancelando cita:", err);
      error("Error", err.message || "No se pudo cancelar la cita");
    }
  };

  const handleDelete = async (cita: any) => {
    if (!confirm(`¿Estás seguro de eliminar esta cita?`)) {
      return;
    }

    try {
      await deleteCita(cita.id);
      
      // Recargar citas
      const citasData = await getCitas();
      const citasFiltradas = citasData.filter((c: any) => c.sede_id === sedeSeleccionada?.id);
      setCitas(citasFiltradas);
      
      success("Eliminada", "Cita eliminada correctamente");
    } catch (err: any) {
      console.error("Error eliminando cita:", err);
      error("Error", err.message || "No se pudo eliminar la cita");
    }
  };

  const handleFinalizar = async (cita: any) => {
    try {
      await updateCita(cita.id, {
        estado: 'completada',
        no_show: false,
        updated_at: new Date().toISOString()
      });
      
      // Enviar encuesta de satisfacción al usuario
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
      
      // Recargar citas
      const citasData = await getCitas();
      const citasFiltradas = citasData.filter((c: any) => c.sede_id === sedeSeleccionada?.id);
      setCitas(citasFiltradas);
      
      success("Completada", `Cita finalizada exitosamente`);
    } catch (err: any) {
      console.error("Error finalizando cita:", err);
      error("Error", err.message || "No se pudo finalizar la cita");
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'cancelada':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'en_curso':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Citas</h1>
          <p className="text-gray-600 mt-1">Administra las citas del día</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-[#2563EB] to-[#1E40AF] hover:from-[#1E40AF] hover:to-[#1E3A8A] text-white shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Cita Manual
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
            <Input
              placeholder="Buscar por nombre, servicio o profesional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12"
            />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Total Citas</p>
                <p className="text-3xl font-bold text-blue-700">{citasHoy.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Completadas</p>
                <p className="text-3xl font-bold text-green-700">
                  {citasHoy.filter(c => c.estado === 'completada').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-700">
                  {citasHoy.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Canceladas</p>
                <p className="text-3xl font-bold text-red-700">
                  {citasHoy.filter(c => c.estado === 'cancelada').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de fecha */}
      <Card className="border-2 border-gray-200 shadow-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
            <Button
              variant={filtroFecha === 'hoy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroFecha('hoy')}
              className={filtroFecha === 'hoy' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
            >
              Hoy
            </Button>
            <Button
              variant={filtroFecha === 'proximas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroFecha('proximas')}
              className={filtroFecha === 'proximas' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
            >
              Próximas
            </Button>
            <Button
              variant={filtroFecha === 'todas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroFecha('todas')}
              className={filtroFecha === 'todas' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
            >
              Todas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de citas */}
      <Card className="border-2 border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
          <CardTitle className="text-xl font-bold text-gray-900">
            {filtroFecha === 'hoy' ? 'Citas del Día' : filtroFecha === 'proximas' ? 'Próximas Citas' : 'Todas las Citas'}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {filtroFecha === 'hoy' 
              ? new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
              : filtroFecha === 'proximas' 
                ? 'Citas futuras desde hoy'
                : 'Todas las citas de la sede'
            }
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Paciente</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Servicio</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Doctor</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Hora</th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Estado</th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {citasFiltradas.length > 0 ? (
                  citasFiltradas.map((cita) => (
                    <tr 
                      key={cita.id} 
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200"
                    >
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{cita.paciente_name || cita.user_name || 'Sin nombre'}</p>
                            {cita.telefono && (
                              <p className="text-xs text-gray-500">{cita.telefono}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                          {cita.servicio || cita.servicio_name || 'Sin servicio'}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-sm text-gray-900">{cita.profesional || cita.profesional_name || 'Sin asignar'}</span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-sm text-gray-900">
                          {new Date(cita.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Clock className="h-4 w-4" />
                          {cita.hora || 'Sin hora'}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <Badge 
                          variant="outline" 
                          className={`${getEstadoColor(cita.estado)} border-2 font-semibold`}
                        >
                          {cita.estado}
                        </Badge>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex justify-end gap-2">
                          {(cita.estado === 'confirmada' || cita.estado === 'pendiente') && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleOpenDialog(cita)}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 shadow-sm"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleCheckIn(cita)}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
                            >
                              <QrCode className="h-4 w-4 mr-1" />
                              Check-in
                            </Button>
                            </>
                          )}
                          {cita.estado === 'en_curso' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleFinalizar(cita)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Finalizar
                            </Button>
                          )}
                          {(cita.estado === 'completada' || cita.estado === 'cancelada') && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleOpenDialog(cita)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 shadow-sm"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCancel(cita)}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-400 shadow-sm"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDelete(cita)}
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 shadow-sm"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Calendar className="h-16 w-16 text-gray-300" />
                        <p className="text-gray-500 font-medium text-lg">No hay citas para mostrar</p>
                        <p className="text-gray-400 text-sm">Comienza agregando una nueva cita</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal para nueva/editar cita */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {isEditing ? "Editar Cita" : "Nueva Cita Manual"}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {isEditing ? "Modifica los datos de la cita" : "Completa los datos para crear una nueva cita"}
            </p>
            {sedeSeleccionada && (
              <p className="text-xs text-gray-500 mt-1">
                Sede: <span className="font-semibold">{sedeSeleccionada.name}</span>
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paciente">Paciente *</Label>
                <Input
                  id="paciente"
                  value={formData.paciente}
                  onChange={(e) => setFormData({ ...formData, paciente: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="servicio">Servicio *</Label>
                <Select value={formData.servicio} onValueChange={(value) => setFormData({ ...formData, servicio: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
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
                <Label htmlFor="profesional">Doctor</Label>
                <Select value={formData.profesional} onValueChange={(value) => setFormData({ ...formData, profesional: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {profesionales.filter(p => {
                      // Filtrar por servicio seleccionado
                      const servicioMatch = !formData.servicio || p.servicios?.includes(servicios.find(s => s.id === formData.servicio)?.name || '');
                      return servicioMatch;
                    }).map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            
            {/* Calendario personalizado */}
            <div className="mt-4">
              <Label>Fecha *</Label>
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
                  <div className="mt-2 border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-lg z-10">
                    {/* Header del Calendario */}
                    <div className="flex items-center justify-between p-2 border-b border-[#E5E7EB] bg-gray-50">
                      <button
                        type="button"
                        onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))}
                        className="p-1 hover:bg-gray-200 rounded transition"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <h3 className="text-sm font-semibold text-[#111827]">
                        {nombresMes[mesActual.getMonth()]} {mesActual.getFullYear()}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))}
                        className="p-1 hover:bg-gray-200 rounded transition"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
              </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-0.5 p-1 bg-gray-50 border-b border-[#E5E7EB]">
                      {diasSemana.map((dia) => (
                        <div key={dia} className="text-center text-[10px] font-medium text-[#6B7280] py-1">
                          {dia}
                        </div>
                      ))}
                    </div>

                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-0.5 p-1">
                      {generarDiasDelCalendario().map((dia, index) => {
                        if (dia === null) {
                          return <div key={index} className="h-7" />;
                        }
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (dia.esValido) {
                                setFormData({ ...formData, fecha: dia.fechaStr, hora: "" }); // Limpiar hora al cambiar fecha
                                setCalendarioAbierto(false); // Cerrar calendario al seleccionar
                              }
                            }}
                            disabled={!dia.esValido}
                            className={`
                              h-7 flex items-center justify-center text-xs rounded transition-all
                              ${!dia.esValido
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                : formData.fecha === dia.fechaStr
                                  ? 'bg-[#2563EB] text-white font-semibold shadow-sm'
                                  : 'bg-white hover:bg-blue-50 border border-gray-200 hover:border-[#2563EB]'
                              }
                              ${dia.esFestivo && 'bg-red-50 text-red-500'}
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
            <div className="mt-4">
              <Label>Hora *</Label>
              {formData.fecha ? (
                <div className="mt-1">
                  {obtenerHorasDisponibles().length > 0 ? (
                    <>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {obtenerHorasDisponibles().map((hora) => {
                          const estaOcupada = horasOcupadas.includes(hora);
                          return (
                            <button
                              key={hora}
                              type="button"
                              onClick={() => !estaOcupada && setFormData({ ...formData, hora })}
                              disabled={estaOcupada}
                              className={`
                                px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium
                                ${estaOcupada
                                  ? 'border-[#D1D5DB] bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed opacity-60'
                                  : formData.hora === hora 
                                    ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]' 
                                    : 'border-[#E5E7EB] hover:border-[#2563EB] hover:bg-blue-50 text-[#111827]'
                                }
                              `}
                            >
                              {hora}
                            </button>
                          );
                        })}
                      </div>
                      {horasOcupadas.length > 0 && (
                        <p className="text-xs text-[#6B7280] mt-2">
                          Las horas marcadas en gris ya están ocupadas
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-red-600 mt-2">
                      No hay horas disponibles para este doctor en la fecha seleccionada
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-1">Selecciona primero una fecha</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCita} className="bg-[#2563EB] hover:bg-[#1E40AF]">
              {isEditing ? "Guardar Cambios" : "Crear Cita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
