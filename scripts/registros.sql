-- =============================================
-- CITA VERDE - DATOS DE EJEMPLO
-- =============================================
-- Este script inserta datos de ejemplo en las tablas
-- IMPORTANTE: Ejecutar DESPUÉS de setup-database.sql
-- Las relaciones están todas correctamente establecidas
-- =============================================

-- =============================================
-- 1. SEDES (Base para todo lo demás)
-- =============================================
INSERT INTO sedes (id, name, address, phone) VALUES
('SED-001', 'Madrid Centro', 'Calle Gran Vía 123, 28013 Madrid', '+34 91 123 4567'),
('SED-002', 'Barcelona Norte', 'Avinguda Diagonal 456, 08008 Barcelona', '+34 93 234 5678'),
('SED-003', 'Valencia Sur', 'Calle Colón 789, 46004 Valencia', '+34 96 345 6789')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. SERVICIOS (Dependen de sedes)
-- =============================================
INSERT INTO servicios (id, name, duration, sede_id, color) VALUES
('SRV-001', 'Consulta General', 30, 'SED-001', '#22c55e'),
('SRV-002', 'Cardiología', 45, 'SED-001', '#3b82f6'),
('SRV-003', 'Pediatría', 25, 'SED-002', '#f59e0b'),
('SRV-004', 'Dermatología', 20, 'SED-003', '#ec4899'),
('SRV-005', 'Medicina General', 30, 'SED-001', '#10b981')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. PROFESIONALES (Dependen de sedes)
-- =============================================
INSERT INTO profesionales (id, name, email, phone, sede_id, servicios) VALUES
('PRO-001', 'Dr. Carlos García', 'carlos.garcia@citavede.com', '+34 600 123 456', 'SED-001', ARRAY['Consulta General', 'Cardiología']),
('PRO-002', 'Dra. María López', 'maria.lopez@citavede.com', '+34 600 234 567', 'SED-002', ARRAY['Pediatría']),
('PRO-003', 'Dr. Juan Sánchez', 'juan.sanchez@citavede.com', '+34 600 345 678', 'SED-003', ARRAY['Dermatología']),
('PRO-004', 'Dra. Ana Martínez', 'ana.martinez@citavede.com', '+34 600 456 789', 'SED-001', ARRAY['Medicina General'])
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. USUARIOS (Referencian sedes)
-- =============================================
INSERT INTO usuarios (id, email, name, password, role, sede_id) VALUES
('e0e0e0e0-0000-0000-0000-000000000001', 'admin@citavede.com', 'Admin Usuario', 'admin123', 'admin', NULL),
('e0e0e0e0-0000-0000-0000-000000000002', 'recepcionista@citavede.com', 'María Recepcionista', 'recepcionista123', 'recepcionista', 'SED-001'),
('e0e0e0e0-0000-0000-0000-000000000003', 'paciente@citavede.com', 'Juan Pérez', 'paciente123', 'usuario', NULL)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 5. CITAS (Dependen de usuarios, sedes, servicios, profesionales)
-- =============================================
INSERT INTO citas (id, user_id, sede_id, servicio_id, servicio, profesional_id, profesional, fecha, hora, estado, qr_code) VALUES
('CIT-001', 'e0e0e0e0-0000-0000-0000-000000000003', 'SED-001', 'SRV-001', 'Consulta General', 'PRO-001', 'Dr. Carlos García', CURRENT_DATE + INTERVAL '2 days', '10:00', 'confirmada', 'QR-CIT-001'),
('CIT-002', 'e0e0e0e0-0000-0000-0000-000000000003', 'SED-002', 'SRV-003', 'Pediatría', 'PRO-002', 'Dra. María López', CURRENT_DATE + INTERVAL '5 days', '14:30', 'pendiente', 'QR-CIT-002'),
('CIT-003', 'e0e0e0e0-0000-0000-0000-000000000003', 'SED-001', 'SRV-005', 'Medicina General', 'PRO-004', 'Dra. Ana Martínez', CURRENT_DATE + INTERVAL '7 days', '09:00', 'confirmada', 'QR-CIT-003')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 6. TURNOS (Dependen de usuarios, sedes, servicios)
-- =============================================
INSERT INTO turnos (id, user_id, paciente, sede_id, servicio_id, servicio, numero, cola, estado, tiempo_estimado) VALUES
('TUR-001', 'e0e0e0e0-0000-0000-0000-000000000003', 'Juan Pérez', 'SED-001', 'SRV-001', 'Consulta General', 15, 'Cola Principal', 'en_espera', 30),
('TUR-002', 'e0e0e0e0-0000-0000-0000-000000000003', 'Juan Pérez', 'SED-002', 'SRV-003', 'Pediatría', 23, 'Cola Pediatría', 'en_atencion', 25)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 7. COLAS (Dependen de servicios)
-- =============================================
INSERT INTO colas (id, name, servicio_id, prioridad, turnos_actuales, tiempo_estimado_total) VALUES
('COL-001', 'Cola Principal', 'SRV-001', 'alta', 12, 30),
('COL-002', 'Cola Urgencias', 'SRV-002', 'alta', 3, 45),
('COL-003', 'Cola Pediatría', 'SRV-003', 'media', 8, 25)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 8. RECURSOS (Dependen de sedes)
-- =============================================
INSERT INTO recursos (id, name, tipo, sede_id, servicios, is_active) VALUES
('REC-001', 'Consultorio 1', 'consultorio', 'SED-001', ARRAY['Consulta General', 'Cardiología'], true),
('REC-002', 'Consultorio 2', 'consultorio', 'SED-001', ARRAY['Medicina General'], true),
('REC-003', 'Sala de Espera', 'sala', 'SED-002', ARRAY['Pediatría'], true),
('REC-004', 'Equipo Cardiológico', 'equipo', 'SED-001', ARRAY['Cardiología'], true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 9. ROLES (Sistema de permisos)
-- =============================================
INSERT INTO roles (id, nombre, descripcion, nivel) VALUES
('ROL-001', 'Administrador', 'Acceso completo al sistema', 10),
('ROL-002', 'Recepcionista', 'Atención al cliente y citas', 5),
('ROL-003', 'Usuario', 'Acceso básico del paciente', 1)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 10. PERMISOS (Definiciones de permisos)
-- =============================================
INSERT INTO permisos (id, modulo, accion, descripcion) VALUES
('p001', 'citas', 'crear', 'Crear citas'),
('p002', 'citas', 'editar', 'Editar citas'),
('p003', 'citas', 'eliminar', 'Eliminar citas'),
('p004', 'citas', 'ver', 'Ver citas'),
('p005', 'citas', 'exportar', 'Exportar citas'),
('p006', 'turnos', 'crear', 'Crear turnos'),
('p007', 'turnos', 'editar', 'Editar turnos'),
('p008', 'turnos', 'eliminar', 'Eliminar turnos'),
('p009', 'turnos', 'ver', 'Ver turnos'),
('p010', 'usuarios', 'crear', 'Crear usuarios'),
('p011', 'usuarios', 'editar', 'Editar usuarios'),
('p012', 'usuarios', 'eliminar', 'Eliminar usuarios'),
('p013', 'usuarios', 'ver', 'Ver usuarios'),
('p014', 'profesionales', 'crear', 'Crear profesionales'),
('p015', 'profesionales', 'editar', 'Editar profesionales'),
('p016', 'profesionales', 'eliminar', 'Eliminar profesionales'),
('p017', 'reportes', 'ver', 'Ver reportes'),
('p018', 'configuracion', 'editar', 'Editar configuración')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 11. ROLES PERMISOS (Asignación de permisos a roles)
-- =============================================
-- Administrador: todos los permisos
INSERT INTO roles_permisos (role_id, permiso_id) VALUES
('ROL-001', 'p001'), ('ROL-001', 'p002'), ('ROL-001', 'p003'), ('ROL-001', 'p004'), ('ROL-001', 'p005'),
('ROL-001', 'p006'), ('ROL-001', 'p007'), ('ROL-001', 'p008'), ('ROL-001', 'p009'),
('ROL-001', 'p010'), ('ROL-001', 'p011'), ('ROL-001', 'p012'), ('ROL-001', 'p013'),
('ROL-001', 'p014'), ('ROL-001', 'p015'), ('ROL-001', 'p016'),
('ROL-001', 'p017'), ('ROL-001', 'p018')
ON CONFLICT DO NOTHING;

-- Recepcionista: solo citas y turnos
INSERT INTO roles_permisos (role_id, permiso_id) VALUES
('ROL-002', 'p001'), ('ROL-002', 'p002'), ('ROL-002', 'p004'),
('ROL-002', 'p006'), ('ROL-002', 'p007'), ('ROL-002', 'p009')
ON CONFLICT DO NOTHING;

-- Usuario: sin permisos de administración
-- Los usuarios solo pueden ver sus propias citas y turnos

-- =============================================
-- 12. DISPONIBILIDAD (Dependen de profesionales)
-- =============================================
INSERT INTO disponibilidad (profesional_id, sede_id, tipo, dia_semana, hora_inicio, hora_fin, recurrente) VALUES
('PRO-001', 'SED-001', 'jornada', 1, '08:00', '14:00', true),  -- Lunes
('PRO-001', 'SED-001', 'jornada', 3, '08:00', '14:00', true),  -- Miércoles
('PRO-001', 'SED-001', 'jornada', 5, '08:00', '13:00', true),  -- Viernes
('PRO-002', 'SED-002', 'jornada', 1, '09:00', '17:00', true),  -- Lunes
('PRO-002', 'SED-002', 'jornada', 2, '09:00', '17:00', true),  -- Martes
('PRO-003', 'SED-003', 'jornada', 3, '10:00', '14:00', true),  -- Miércoles
('PRO-004', 'SED-001', 'jornada', 4, '08:00', '13:00', true)   -- Jueves
ON CONFLICT DO NOTHING;

-- =============================================
-- 13. HORARIOS ESPECIALES (Dependen de sedes)
-- =============================================
INSERT INTO horarios_especiales (sede_id, nombre, fecha, hora_inicio, hora_fin, es_festivo, descripcion) VALUES
('SED-001', 'Año Nuevo', CURRENT_DATE + INTERVAL '10 days', '00:00', '23:59', true, 'Día festivo - Cerrado'),
('SED-001', 'Horario Reducido Navidad', CURRENT_DATE + INTERVAL '20 days', '10:00', '14:00', false, 'Horario especial de Navidad'),
('SED-002', 'Día de la Constitución', CURRENT_DATE + INTERVAL '15 days', '00:00', '23:59', true, 'Día festivo')
ON CONFLICT DO NOTHING;

-- =============================================
-- 14. PLANTILLAS DE MENSAJES
-- =============================================
INSERT INTO plantillas_mensajes (nombre, tipo, categoria, asunto, contenido, variables_disponibles) VALUES
('Recordatorio Cita', 'email', 'recordatorio', 'Recordatorio de Cita - {{fecha}}', 
'Estimado/a {{nombre}}, le recordamos su cita el día {{fecha}} a las {{hora}} en {{sede}} ({{direccion}}). Por favor, confirme su asistencia.',
 ARRAY['{{nombre}}', '{{fecha}}', '{{hora}}', '{{sede}}', '{{direccion}}']),
 
('Confirmación Cita', 'email', 'confirmacion', 'Confirmación de Cita - {{codigo}}',
'Su cita ha sido confirmada para el día {{fecha}} a las {{hora}}. Su código de cita es: {{codigo}}.',
 ARRAY['{{nombre}}', '{{fecha}}', '{{hora}}', '{{codigo}}']),
 
('Turno Listo SMS', 'sms', 'turno_listo', NULL,
'Su turno está listo. Acérquese a la ventanilla {{numero}}. Tiempo estimado: {{tiempo}} min.',
 ARRAY['{{nombre}}', '{{numero}}', '{{tiempo}}']),
 
('Cancelación Cita', 'email', 'cancelacion', 'Cita Cancelada',
'Su cita programada para el día {{fecha}} ha sido cancelada. Si desea reprogramar, por favor visite nuestra plataforma.',
 ARRAY['{{nombre}}', '{{fecha}}', '{{motivo}}']),
 
('Recordatorio WhatsApp', 'whatsapp', 'recordatorio', NULL,
'Hola {{nombre}}, te recordamos tu cita el {{fecha}} a las {{hora}}. Confirma tu asistencia respondiendo CONFIRMAR.',
 ARRAY['{{nombre}}', '{{fecha}}', '{{hora}}'])
ON CONFLICT DO NOTHING;

-- =============================================
-- 15. LOGS QR (Historial de escaneos)
-- =============================================
INSERT INTO logs_qr (qr_code, cita_id, usuario_id, ip_address, dispositivo, resultado) VALUES
('QR-CIT-001', 'CIT-001', 'e0e0e0e0-0000-0000-0000-000000000003', '192.168.1.1', 'Android', 'exitoso'),
('QR-CIT-002', 'CIT-002', 'e0e0e0e0-0000-0000-0000-000000000003', '192.168.1.2', 'iOS', 'fallido'),
('QR-CIT-001', 'CIT-001', 'e0e0e0e0-0000-0000-0000-000000000003', '192.168.1.3', 'Android', 'usado')
ON CONFLICT DO NOTHING;

-- =============================================
-- FIN DE DATOS DE EJEMPLO
-- =============================================
