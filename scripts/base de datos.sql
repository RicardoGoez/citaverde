-- =============================================
-- CITA VERDE - SCRIPT DE BASE DE DATOS COMPLETO
-- =============================================
-- Este script crea la estructura completa de la base de datos
-- para el sistema de gestión de citas y turnos CitaVerde
-- 
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'recepcionista', 'usuario')),
    sede_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de sedes
CREATE TABLE IF NOT EXISTS sedes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL,
    sede_id TEXT NOT NULL REFERENCES sedes(id),
    is_active BOOLEAN DEFAULT true,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de profesionales
CREATE TABLE IF NOT EXISTS profesionales (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    sede_id TEXT NOT NULL REFERENCES sedes(id),
    servicios TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS citas (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES usuarios(id),
    sede_id TEXT NOT NULL REFERENCES sedes(id),
    servicio_id TEXT NOT NULL REFERENCES servicios(id),
    servicio TEXT,
    profesional_id TEXT REFERENCES profesionales(id),
    profesional TEXT,
    fecha DATE NOT NULL,
    hora TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada')),
    check_in_time TIMESTAMP WITH TIME ZONE,
    qr_code TEXT,
    motivo TEXT,
    hora_checkin TIMESTAMP WITH TIME ZONE,
    no_show BOOLEAN DEFAULT false,
    tiempo_espera_minutos INTEGER,
    evaluacion INTEGER CHECK (evaluacion BETWEEN 1 AND 5),
    confirmation_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de turnos
CREATE TABLE IF NOT EXISTS turnos (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES usuarios(id),
    paciente TEXT NOT NULL,
    sede_id TEXT NOT NULL REFERENCES sedes(id),
    servicio_id TEXT NOT NULL REFERENCES servicios(id),
    servicio TEXT,
    numero INTEGER NOT NULL,
    cola TEXT NOT NULL,
    cola_id TEXT,
    estado TEXT NOT NULL CHECK (estado IN ('en_espera', 'en_atencion', 'atendido', 'cancelado', 'no_presentado')),
    tipo TEXT CHECK (tipo IN ('digital', 'papel')),
    tiempo_estimado INTEGER,
    llamada_at TIMESTAMP WITH TIME ZONE,
    creado_at TEXT,
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AGREGAR TABLA DE CONFIGURACIÓN
-- =============================================
-- Este script agrega la tabla de configuración del sistema
-- para almacenar valores como ventanas de check-in, timezone, etc.
-- =============================================

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Las configuraciones se insertan desde registros.sql

-- Crear índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON configuracion(clave);

-- Permisos RLS
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden ver y modificar
CREATE POLICY "Solo admins pueden ver configuración"
    ON configuracion FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id::text = current_setting('app.user_id', true)
            AND usuarios.role = 'admin'
        )
    );

CREATE POLICY "Solo admins pueden modificar configuración"
    ON configuracion FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id::text = current_setting('app.user_id', true)
            AND usuarios.role = 'admin'
        )
    );



-- Tabla de colas
CREATE TABLE IF NOT EXISTS colas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    servicio_id TEXT NOT NULL REFERENCES servicios(id),
    prioridad TEXT NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta')),
    is_active BOOLEAN DEFAULT true,
    is_cerrada BOOLEAN DEFAULT false,
    turnos_actuales INTEGER DEFAULT 0,
    tiempo_estimado_total INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de recursos
CREATE TABLE IF NOT EXISTS recursos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('consultorio', 'sala', 'equipo', 'vehiculo')),
    sede_id TEXT NOT NULL REFERENCES sedes(id),
    servicios TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MÓDULOS AVANZADOS
-- =============================================

-- Tabla de logs QR para auditoría
CREATE TABLE IF NOT EXISTS logs_qr (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    qr_code TEXT NOT NULL,
    cita_id TEXT REFERENCES citas(id),
    turno_id TEXT REFERENCES turnos(id),
    usuario_id UUID REFERENCES usuarios(id),
    ip_address TEXT,
    user_agent TEXT,
    dispositivo TEXT,
    ubicacion TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resultado TEXT NOT NULL CHECK (resultado IN ('exitoso', 'fallido', 'usado', 'vencido', 'invalido'))
);

-- Tabla de roles personalizados
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    nivel INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de permisos
CREATE TABLE IF NOT EXISTS permisos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    modulo TEXT NOT NULL,
    accion TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asignación de permisos a roles
CREATE TABLE IF NOT EXISTS roles_permisos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id TEXT NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permiso_id)
);

-- Tabla de disponibilidad de profesionales
CREATE TABLE IF NOT EXISTS disponibilidad (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    profesional_id TEXT NOT NULL REFERENCES profesionales(id),
    sede_id TEXT REFERENCES sedes(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('jornada', 'ausencia', 'festivo', 'vacacion')),
    dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6),
    fecha_inicio DATE,
    fecha_fin DATE,
    hora_inicio TIME,
    hora_fin TIME,
    motivo TEXT,
    recurrente BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de horarios especiales por sede
CREATE TABLE IF NOT EXISTS horarios_especiales (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    sede_id TEXT NOT NULL REFERENCES sedes(id),
    nombre TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    es_festivo BOOLEAN DEFAULT false,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de plantillas de mensajes
CREATE TABLE IF NOT EXISTS plantillas_mensajes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('email', 'sms', 'whatsapp', 'push')),
    categoria TEXT NOT NULL,
    asunto TEXT,
    contenido TEXT NOT NULL,
    variables_disponibles TEXT[],
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


 

-- =============================================
-- 
--ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================

-- Índices de usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_sede ON usuarios(sede_id);

-- Índices de citas
CREATE INDEX IF NOT EXISTS idx_citas_user_id ON citas(user_id);
CREATE INDEX IF NOT EXISTS idx_citas_sede_id ON citas(sede_id);
CREATE INDEX IF NOT EXISTS idx_citas_servicio_id ON citas(servicio_id);
CREATE INDEX IF NOT EXISTS idx_citas_profesional_id ON citas(profesional_id);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_checkin ON citas(hora_checkin);
CREATE INDEX IF NOT EXISTS idx_citas_no_show ON citas(no_show);
CREATE INDEX IF NOT EXISTS idx_citas_qr_code ON citas(qr_code);
CREATE INDEX IF NOT EXISTS idx_citas_confirmation_token ON citas(confirmation_token);

-- Índices de turnos
CREATE INDEX IF NOT EXISTS idx_turnos_user_id ON turnos(user_id);
CREATE INDEX IF NOT EXISTS idx_turnos_sede_id ON turnos(sede_id);
CREATE INDEX IF NOT EXISTS idx_turnos_servicio_id ON turnos(servicio_id);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);
CREATE INDEX IF NOT EXISTS idx_turnos_qr_code ON turnos(qr_code);

-- Índices de servicios
CREATE INDEX IF NOT EXISTS idx_servicios_sede_id ON servicios(sede_id);
CREATE INDEX IF NOT EXISTS idx_servicios_is_active ON servicios(is_active);

-- Índices de profesionales
CREATE INDEX IF NOT EXISTS idx_profesionales_sede_id ON profesionales(sede_id);
CREATE INDEX IF NOT EXISTS idx_profesionales_is_active ON profesionales(is_active);

-- Índices de logs QR
CREATE INDEX IF NOT EXISTS idx_logs_qr_qr_code ON logs_qr(qr_code);
CREATE INDEX IF NOT EXISTS idx_logs_qr_timestamp ON logs_qr(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_qr_resultado ON logs_qr(resultado);

-- Índices de roles y permisos
CREATE INDEX IF NOT EXISTS idx_roles_nivel ON roles(nivel);
CREATE INDEX IF NOT EXISTS idx_roles_permisos_role ON roles_permisos(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_permisos_permiso ON roles_permisos(permiso_id);

-- Índices de disponibilidad
CREATE INDEX IF NOT EXISTS idx_disponibilidad_profesional ON disponibilidad(profesional_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidad_tipo ON disponibilidad(tipo);
CREATE INDEX IF NOT EXISTS idx_disponibilidad_fechas ON disponibilidad(fecha_inicio, fecha_fin);

-- Índices de plantillas
CREATE INDEX IF NOT EXISTS idx_plantillas_tipo ON plantillas_mensajes(tipo);
CREATE INDEX IF NOT EXISTS idx_plantillas_categoria ON plantillas_mensajes(categoria);
CREATE INDEX IF NOT EXISTS idx_plantillas_activa ON plantillas_mensajes(activa);


-- Habilitar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE colas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_qr ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_especiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_mensajes ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permite todo para desarrollo)
DROP POLICY IF EXISTS "Allow all" ON usuarios;
DROP POLICY IF EXISTS "Allow all" ON sedes;
DROP POLICY IF EXISTS "Allow all" ON servicios;
DROP POLICY IF EXISTS "Allow all" ON profesionales;
DROP POLICY IF EXISTS "Allow all" ON citas;
DROP POLICY IF EXISTS "Allow all" ON turnos;
DROP POLICY IF EXISTS "Allow all" ON colas;
DROP POLICY IF EXISTS "Allow all" ON recursos;
DROP POLICY IF EXISTS "Allow all" ON logs_qr;
DROP POLICY IF EXISTS "Allow all" ON roles;
DROP POLICY IF EXISTS "Allow all" ON permisos;
DROP POLICY IF EXISTS "Allow all" ON roles_permisos;
DROP POLICY IF EXISTS "Allow all" ON disponibilidad;
DROP POLICY IF EXISTS "Allow all" ON horarios_especiales;
DROP POLICY IF EXISTS "Allow all" ON plantillas_mensajes;

CREATE POLICY "Allow all" ON usuarios FOR ALL USING (true);
CREATE POLICY "Allow all" ON sedes FOR ALL USING (true);
CREATE POLICY "Allow all" ON servicios FOR ALL USING (true);
CREATE POLICY "Allow all" ON profesionales FOR ALL USING (true);
CREATE POLICY "Allow all" ON citas FOR ALL USING (true);
CREATE POLICY "Allow all" ON turnos FOR ALL USING (true);
CREATE POLICY "Allow all" ON colas FOR ALL USING (true);
CREATE POLICY "Allow all" ON recursos FOR ALL USING (true);
CREATE POLICY "Allow all" ON logs_qr FOR ALL USING (true);
CREATE POLICY "Allow all" ON roles FOR ALL USING (true);
CREATE POLICY "Allow all" ON permisos FOR ALL USING (true);
CREATE POLICY "Allow all" ON roles_permisos FOR ALL USING (true);
CREATE POLICY "Allow all" ON disponibilidad FOR ALL USING (true);
CREATE POLICY "Allow all" ON horarios_especiales FOR ALL USING (true);
CREATE POLICY "Allow all" ON plantillas_mensajes FOR ALL USING (true);
