export type UserRole = "admin" | "recepcionista" | "usuario";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  sede?: string;
  sede_id?: string;
  phone?: string;
  email_verificado?: boolean;
  token_verificacion?: string;
}

export interface Sede {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export interface Servicio {
  id: string;
  name: string;
  duration: number;
  sedeId: string;
  isActive: boolean;
  color?: string;
}

export interface Profesional {
  id: string;
  name: string;
  email: string;
  phone: string;
  sedeId: string;
  servicios: string[];
  isActive: boolean;
}

export interface Cita {
  id: string;
  userId: string;
  sedeId: string;
  servicioId: string;
  profesionalId: string;
  fecha: Date;
  hora: string;
  estado: "confirmada" | "en_curso" | "completada" | "cancelada";
  checkInTime?: Date;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Turno {
  id: string;
  userId: string;
  sedeId: string;
  servicioId: string;
  numero: number;
  estado: "esperando" | "llamado" | "atendido" | "cancelado";
  tiempoEstimado?: number;
  llamadaAt?: Date;
  createdAt: Date;
}

export interface Cola {
  id: string;
  name: string;
  servicioId: string;
  prioridad: "alta" | "media" | "baja";
  isActive: boolean;
  isCerrada: boolean;
  turnosActuales: number;
  tiempoEstimadoTotal: number;
}

export interface Recurso {
  id: string;
  name: string;
  tipo: "consultorio" | "ventanilla" | "equipo";
  sedeId: string;
  servicios: string[];
  isActive: boolean;
}

export interface Disponibilidad {
  id: string;
  profesionalId: string;
  diaSemana: number; // 0-6
  horaInicio: string;
  horaFin: string;
  esFeriado?: boolean;
  ausencia?: {
    fechaInicio: Date;
    fechaFin: Date;
    motivo: string;
  };
}

export interface Config {
  id: string;
  key: string;
  value: string;
  tipo: "string" | "number" | "boolean" | "json";
}

export interface KPI {
  periodo: string;
  totalCitas: number;
  atendidas: number;
  noShow: number;
  tiempoPromedioEspera: number;
  cumplimientoSLA: number;
  ratingPromedio: number;
  turnosDigitales: number;
  turnosPapel: number;
  ahorroPapel: number;
  ahorroCO2: number;
}

export interface Mensaje {
  id: string;
  tipo: "recordatorio" | "confirmacion" | "cancelacion" | "turno_actual" | "retencion";
  destinatario: string;
  canal: "email" | "sms" | "whatsapp";
  estado: "enviado" | "pendiente" | "error";
  sentAt?: Date;
  contenido: string;
}
