-- =============================================
-- RESERVEFLOW - DATOS REALES
-- =============================================
-- Datos de ejemplo para Montería, Córdoba, Colombia
-- IMPORTANTE: Ejecutar DESPUÉS de setup-database.sql
-- =============================================

-- =============================================
-- 1. SEDES (Clínicas en Montería, Córdoba)
-- =============================================
INSERT INTO sedes (id, name, address, phone) VALUES
('SED-001', 'Clínica Los Rosales', 'Carrera 6 # 72-100, Barrio Los Rosales, Montería', '+57 314 867 5423'),
('SED-002', 'Centro Médico del Sinú', 'Calle 22 # 3-45, Centro, Montería', '+57 301 234 5678'),
('SED-003', 'Hospital San Jerónimo Norte', 'Av. Primera de Mayo # 15-80, Norte', '+57 310 987 6543')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. SERVICIOS (6 servicios por cada sede - 18 servicios totales)
-- =============================================
-- Clínica Los Rosales (SED-001)
INSERT INTO servicios (id, name, duration, sede_id, color, is_active) VALUES
('SRV-001', 'Medicina General', 30, 'SED-001', '#22c55e', true),
('SRV-002', 'Pediatría', 25, 'SED-001', '#3b82f6', true),
('SRV-003', 'Ginecología', 45, 'SED-001', '#ec4899', true),
('SRV-004', 'Cardiología', 40, 'SED-001', '#ef4444', true),
('SRV-005', 'Psicología', 50, 'SED-001', '#a855f7', true),
('SRV-006', 'Dermatología', 30, 'SED-001', '#f59e0b', true),

-- Centro Médico del Sinú (SED-002)
('SRV-007', 'Medicina General', 30, 'SED-002', '#22c55e', true),
('SRV-008', 'Oftalmología', 35, 'SED-002', '#06b6d4', true),
('SRV-009', 'Ortopedia', 45, 'SED-002', '#6366f1', true),
('SRV-010', 'Neurología', 40, 'SED-002', '#8b5cf6', true),
('SRV-011', 'Endocrinología', 35, 'SED-002', '#10b981', true),
('SRV-012', 'Oncología', 60, 'SED-002', '#dc2626', true),

-- Hospital San Jerónimo Norte (SED-003)
('SRV-013', 'Medicina General', 30, 'SED-003', '#22c55e', true),
('SRV-014', 'Medicina Interna', 40, 'SED-003', '#16a34a', true),
('SRV-015', 'Traumatología', 45, 'SED-003', '#ea580c', true),
('SRV-016', 'Urología', 35, 'SED-003', '#0891b2', true),
('SRV-017', 'Gastroenterología', 40, 'SED-003', '#0284c7', true),
('SRV-018', 'Psiquiatría', 50, 'SED-003', '#7c3aed', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. PROFESIONALES (2 doctores por servicio - 36 doctores totales)
-- =============================================
-- Clínica Los Rosales (SED-001)
INSERT INTO profesionales (id, name, email, phone, sede_id, servicios, is_active) VALUES
-- Medicina General - 2 doctores
('PRO-001', 'Dr. Juan Carlos Pérez', 'jc.perez@clinicarosales.co', '+57 300 111 1111', 'SED-001', ARRAY['Medicina General'], true),
('PRO-002', 'Dra. María Elena Gómez', 'maria.gomez@clinicarosales.co', '+57 300 111 1112', 'SED-001', ARRAY['Medicina General'], true),

-- Pediatría - 2 doctores
('PRO-003', 'Dr. Carlos Alberto Martínez', 'carlos.martinez@clinicarosales.co', '+57 300 111 1113', 'SED-001', ARRAY['Pediatría'], true),
('PRO-004', 'Dra. Laura Patricia Ruiz', 'laura.ruiz@clinicarosales.co', '+57 300 111 1114', 'SED-001', ARRAY['Pediatría'], true),

-- Ginecología - 2 doctores
('PRO-005', 'Dr. Eduardo Sánchez', 'eduardo.sanchez@clinicarosales.co', '+57 300 111 1115', 'SED-001', ARRAY['Ginecología'], true),
('PRO-006', 'Dra. Ana Sofía Ramírez', 'ana.ramirez@clinicarosales.co', '+57 300 111 1116', 'SED-001', ARRAY['Ginecología'], true),

-- Cardiología - 2 doctores
('PRO-007', 'Dr. Jorge Luis Herrera', 'jorge.herrera@clinicarosales.co', '+57 300 111 1117', 'SED-001', ARRAY['Cardiología'], true),
('PRO-008', 'Dra. Claudia Esperanza López', 'claudia.lopez@clinicarosales.co', '+57 300 111 1118', 'SED-001', ARRAY['Cardiología'], true),

-- Psicología - 2 doctores
('PRO-009', 'Dr. Roberto Andrés Díaz', 'roberto.diaz@clinicarosales.co', '+57 300 111 1119', 'SED-001', ARRAY['Psicología'], true),
('PRO-010', 'Dra. Juliana Estefanía Córdoba', 'juliana.cordoba@clinicarosales.co', '+57 300 111 1120', 'SED-001', ARRAY['Psicología'], true),

-- Dermatología - 2 doctores
('PRO-011', 'Dr. Luis Fernando Castro', 'luis.castro@clinicarosales.co', '+57 300 111 1121', 'SED-001', ARRAY['Dermatología'], true),
('PRO-012', 'Dra. Patricia Beatriz Vargas', 'patricia.vargas@clinicarosales.co', '+57 300 111 1122', 'SED-001', ARRAY['Dermatología'], true),

-- Centro Médico del Sinú (SED-002)
-- Medicina General - 2 doctores
('PRO-013', 'Dr. Alejandro Morales', 'alejandro.morales@centrosinu.co', '+57 300 222 2221', 'SED-002', ARRAY['Medicina General'], true),
('PRO-014', 'Dra. Diana Carolina Moreno', 'diana.moreno@centrosinu.co', '+57 300 222 2222', 'SED-002', ARRAY['Medicina General'], true),

-- Oftalmología - 2 doctores
('PRO-015', 'Dr. Hernán Augusto Jiménez', 'hernan.jimenez@centrosinu.co', '+57 300 222 2223', 'SED-002', ARRAY['Oftalmología'], true),
('PRO-016', 'Dra. Marcela Alejandra Torres', 'marcela.torres@centrosinu.co', '+57 300 222 2224', 'SED-002', ARRAY['Oftalmología'], true),

-- Ortopedia - 2 doctores
('PRO-017', 'Dr. Fabio Nelson Agudelo', 'fabio.agudelo@centrosinu.co', '+57 300 222 2225', 'SED-002', ARRAY['Ortopedia'], true),
('PRO-018', 'Dra. Natalia Andrea Velásquez', 'natalia.velasquez@centrosinu.co', '+57 300 222 2226', 'SED-002', ARRAY['Ortopedia'], true),

-- Neurología - 2 doctores
('PRO-019', 'Dr. Oscar David Restrepo', 'oscar.restrepo@centrosinu.co', '+57 300 222 2227', 'SED-002', ARRAY['Neurología'], true),
('PRO-020', 'Dra. Camila Andrea Muñoz', 'camila.munoz@centrosinu.co', '+57 300 222 2228', 'SED-002', ARRAY['Neurología'], true),

-- Endocrinología - 2 doctores
('PRO-021', 'Dr. Sergio Luis Ospina', 'sergio.ospina@centrosinu.co', '+57 300 222 2229', 'SED-002', ARRAY['Endocrinología'], true),
('PRO-022', 'Dra. Karen Tatiana Bedoya', 'karen.bedoya@centrosinu.co', '+57 300 222 2230', 'SED-002', ARRAY['Endocrinología'], true),

-- Oncología - 2 doctores
('PRO-023', 'Dr. Carlos Mario Zapata', 'carlos.zapata@centrosinu.co', '+57 300 222 2231', 'SED-002', ARRAY['Oncología'], true),
('PRO-024', 'Dra. Ángela María Quiroz', 'angela.quiroz@centrosinu.co', '+57 300 222 2232', 'SED-002', ARRAY['Oncología'], true),

-- Hospital San Jerónimo Norte (SED-003)
-- Medicina General - 2 doctores
('PRO-025', 'Dr. Jaime Alberto Mejía', 'jaime.mejia@hospitalsanjeronimo.co', '+57 300 333 3331', 'SED-003', ARRAY['Medicina General'], true),
('PRO-026', 'Dra. Sandra Milena García', 'sandra.garcia@hospitalsanjeronimo.co', '+57 300 333 3332', 'SED-003', ARRAY['Medicina General'], true),

-- Medicina Interna - 2 doctores
('PRO-027', 'Dr. Alonso Ríos', 'alonso.rios@hospitalsanjeronimo.co', '+57 300 333 3333', 'SED-003', ARRAY['Medicina Interna'], true),
('PRO-028', 'Dra. Diana Marcela Arango', 'diana.arango@hospitalsanjeronimo.co', '+57 300 333 3334', 'SED-003', ARRAY['Medicina Interna'], true),

-- Traumatología - 2 doctores
('PRO-029', 'Dr. Víctor Manuel Cardona', 'victor.cardona@hospitalsanjeronimo.co', '+57 300 333 3335', 'SED-003', ARRAY['Traumatología'], true),
('PRO-030', 'Dra. Mónica Patricia Acevedo', 'monica.acevedo@hospitalsanjeronimo.co', '+57 300 333 3336', 'SED-003', ARRAY['Traumatología'], true),

-- Urología - 2 doctores
('PRO-031', 'Dr. Freddy Alonso Montoya', 'freddy.montoya@hospitalsanjeronimo.co', '+57 300 333 3337', 'SED-003', ARRAY['Urología'], true),
('PRO-032', 'Dra. Ligia María Franco', 'ligia.franco@hospitalsanjeronimo.co', '+57 300 333 3338', 'SED-003', ARRAY['Urología'], true),

-- Gastroenterología - 2 doctores
('PRO-033', 'Dr. José María Higuita', 'jose.higuita@hospitalsanjeronimo.co', '+57 300 333 3339', 'SED-003', ARRAY['Gastroenterología'], true),
('PRO-034', 'Dra. Carolina Isabel Arbeláez', 'carolina.arbelaez@hospitalsanjeronimo.co', '+57 300 333 3340', 'SED-003', ARRAY['Gastroenterología'], true),

-- Psiquiatría - 2 doctores
('PRO-035', 'Dr. Germán Alonso Valencia', 'german.valencia@hospitalsanjeronimo.co', '+57 300 333 3341', 'SED-003', ARRAY['Psiquiatría'], true),
('PRO-036', 'Dra. Adriana Lucía Giraldo', 'adriana.giraldo@hospitalsanjeronimo.co', '+57 300 333 3342', 'SED-003', ARRAY['Psiquiatría'], true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. USUARIOS (Admin, Recepcionistas y Pacientes)
-- =============================================
INSERT INTO usuarios (id, email, name, password, role, sede_id) VALUES
-- Administrador
('e0e0e0e0-0000-0000-0000-000000000001', 'admin@citaverde.co', 'Administrador Sistema', 'admin123', 'admin', NULL),

-- Recepcionistas (1 por sede)
('e0e0e0e0-0000-0000-0000-000000000002', 'recepcionista.losrosales@citaverde.co', 'María González', 'recep123', 'recepcionista', 'SED-001'),
('e0e0e0e0-0000-0000-0000-000000000010', 'recepcionista.sinu@citaverde.co', 'Juan Pablo Mejía', 'recep123', 'recepcionista', 'SED-002'),
('e0e0e0e0-0000-0000-0000-000000000011', 'recepcionista.sanjeronimo@citaverde.co', 'Carmen Rosa López', 'recep123', 'recepcionista', 'SED-003'),

-- Pacientes de ejemplo
('e0e0e0e0-0000-0000-0000-000000000003', 'paciente1@citaverde.co', 'Carlos Andrés Pérez', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000004', 'paciente2@citaverde.co', 'María Fernanda Ruiz', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000005', 'paciente3@citaverde.co', 'José David Martínez', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000006', 'paciente4@citaverde.co', 'Laura Tatiana Gómez', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000007', 'paciente5@citaverde.co', 'Pedro Alonso Díaz', 'paciente123', 'usuario', NULL)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 5. RECURSOS (Consultorios, salas y equipos por sede)
-- =============================================
-- Clínica Los Rosales (SED-001)
INSERT INTO recursos (id, name, tipo, sede_id, servicios, is_active) VALUES
('REC-001', 'Consultorio 101', 'consultorio', 'SED-001', ARRAY['Medicina General'], true),
('REC-002', 'Consultorio 102', 'consultorio', 'SED-001', ARRAY['Medicina General'], true),
('REC-003', 'Consultorio 201', 'consultorio', 'SED-001', ARRAY['Pediatría'], true),
('REC-004', 'Consultorio 202', 'consultorio', 'SED-001', ARRAY['Pediatría'], true),
('REC-005', 'Consultorio 301', 'consultorio', 'SED-001', ARRAY['Ginecología'], true),
('REC-006', 'Consultorio 302', 'consultorio', 'SED-001', ARRAY['Ginecología'], true),
('REC-007', 'Consultorio 401', 'consultorio', 'SED-001', ARRAY['Cardiología'], true),
('REC-008', 'Consultorio 402', 'consultorio', 'SED-001', ARRAY['Cardiología'], true),
('REC-009', 'Consultorio 501', 'consultorio', 'SED-001', ARRAY['Psicología'], true),
('REC-010', 'Consultorio 502', 'consultorio', 'SED-001', ARRAY['Psicología'], true),
('REC-011', 'Consultorio 601', 'consultorio', 'SED-001', ARRAY['Dermatología'], true),
('REC-012', 'Consultorio 602', 'consultorio', 'SED-001', ARRAY['Dermatología'], true),
('REC-013', 'Sala de Espera Principal', 'sala', 'SED-001', ARRAY['Medicina General', 'Pediatría', 'Ginecología', 'Cardiología', 'Psicología', 'Dermatología'], true),
('REC-014', 'Equipo Electrocardiograma', 'equipo', 'SED-001', ARRAY['Cardiología'], true),
('REC-015', 'Lámpara de Dermatoscopia', 'equipo', 'SED-001', ARRAY['Dermatología'], true),

-- Centro Médico del Sinú (SED-002)
('REC-016', 'Consultorio 201', 'consultorio', 'SED-002', ARRAY['Medicina General'], true),
('REC-017', 'Consultorio 202', 'consultorio', 'SED-002', ARRAY['Medicina General'], true),
('REC-018', 'Consultorio 301', 'consultorio', 'SED-002', ARRAY['Oftalmología'], true),
('REC-019', 'Consultorio 302', 'consultorio', 'SED-002', ARRAY['Oftalmología'], true),
('REC-020', 'Consultorio 401', 'consultorio', 'SED-002', ARRAY['Ortopedia'], true),
('REC-021', 'Consultorio 402', 'consultorio', 'SED-002', ARRAY['Ortopedia'], true),
('REC-022', 'Consultorio 501', 'consultorio', 'SED-002', ARRAY['Neurología'], true),
('REC-023', 'Consultorio 502', 'consultorio', 'SED-002', ARRAY['Neurología'], true),
('REC-024', 'Consultorio 601', 'consultorio', 'SED-002', ARRAY['Endocrinología'], true),
('REC-025', 'Consultorio 602', 'consultorio', 'SED-002', ARRAY['Endocrinología'], true),
('REC-026', 'Consultorio 701', 'consultorio', 'SED-002', ARRAY['Oncología'], true),
('REC-027', 'Consultorio 702', 'consultorio', 'SED-002', ARRAY['Oncología'], true),
('REC-028', 'Sala de Espera Principal', 'sala', 'SED-002', ARRAY['Medicina General', 'Oftalmología', 'Ortopedia', 'Neurología', 'Endocrinología', 'Oncología'], true),
('REC-029', 'Auto-refractor Oftálmico', 'equipo', 'SED-002', ARRAY['Oftalmología'], true),
('REC-030', 'Lámpara de Hendidura', 'equipo', 'SED-002', ARRAY['Oftalmología'], true),
('REC-031', 'Gammacámara', 'equipo', 'SED-002', ARRAY['Oncología'], true),

-- Hospital San Jerónimo Norte (SED-003)
('REC-032', 'Consultorio 301', 'consultorio', 'SED-003', ARRAY['Medicina General'], true),
('REC-033', 'Consultorio 302', 'consultorio', 'SED-003', ARRAY['Medicina General'], true),
('REC-034', 'Consultorio 401', 'consultorio', 'SED-003', ARRAY['Medicina Interna'], true),
('REC-035', 'Consultorio 402', 'consultorio', 'SED-003', ARRAY['Medicina Interna'], true),
('REC-036', 'Consultorio 501', 'consultorio', 'SED-003', ARRAY['Traumatología'], true),
('REC-037', 'Consultorio 502', 'consultorio', 'SED-003', ARRAY['Traumatología'], true),
('REC-038', 'Consultorio 601', 'consultorio', 'SED-003', ARRAY['Urología'], true),
('REC-039', 'Consultorio 602', 'consultorio', 'SED-003', ARRAY['Urología'], true),
('REC-040', 'Consultorio 701', 'consultorio', 'SED-003', ARRAY['Gastroenterología'], true),
('REC-041', 'Consultorio 702', 'consultorio', 'SED-003', ARRAY['Gastroenterología'], true),
('REC-042', 'Consultorio 801', 'consultorio', 'SED-003', ARRAY['Psiquiatría'], true),
('REC-043', 'Consultorio 802', 'consultorio', 'SED-003', ARRAY['Psiquiatría'], true),
('REC-044', 'Sala de Espera Principal', 'sala', 'SED-003', ARRAY['Medicina General', 'Medicina Interna', 'Traumatología', 'Urología', 'Gastroenterología', 'Psiquiatría'], true),
('REC-045', 'Rayos X Portátil', 'equipo', 'SED-003', ARRAY['Traumatología', 'Ortopedia'], true),
('REC-046', 'Ecógrafo', 'equipo', 'SED-003', ARRAY['Gastroenterología', 'Urología'], true),
('REC-047', 'Endoscopio', 'equipo', 'SED-003', ARRAY['Gastroenterología'], true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 6. COLAS (Por servicio, 2 colas por servicio principal)
-- =============================================
-- Clínica Los Rosales
INSERT INTO colas (id, name, servicio_id, prioridad, is_active, is_cerrada, turnos_actuales, tiempo_estimado_total) VALUES
('COL-001', 'Cola Medicina General - Mañana', 'SRV-001', 'alta', true, false, 0, 60),
('COL-002', 'Cola Pediatría - Tarde', 'SRV-002', 'alta', true, false, 0, 45),
('COL-003', 'Cola Ginecología', 'SRV-003', 'media', true, false, 0, 90),
('COL-004', 'Cola Cardiología', 'SRV-004', 'alta', true, false, 0, 80),

-- Centro Médico del Sinú
('COL-005', 'Cola Medicina General', 'SRV-007', 'alta', true, false, 0, 60),
('COL-006', 'Cola Oftalmología', 'SRV-008', 'media', true, false, 0, 70),
('COL-007', 'Cola Ortopedia', 'SRV-009', 'alta', true, false, 0, 90),
('COL-008', 'Cola Neurología', 'SRV-010', 'media', true, false, 0, 80),

-- Hospital San Jerónimo Norte
('COL-009', 'Cola Medicina General', 'SRV-013', 'alta', true, false, 0, 60),
('COL-010', 'Cola Medicina Interna', 'SRV-014', 'media', true, false, 0, 80),
('COL-011', 'Cola Traumatología', 'SRV-015', 'alta', true, false, 0, 90),
('COL-012', 'Cola Gastroenterología', 'SRV-017', 'media', true, false, 0, 80)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 7. DISPONIBILIDAD (Horarios de cada doctor)
-- =============================================
-- Horarios de Lunes a Viernes (9 AM - 12 PM y 2 PM - 5 PM)
-- Cada doctor trabaja 4 días a la semana

-- Clínica Los Rosales - Medicina General
INSERT INTO disponibilidad (profesional_id, sede_id, tipo, dia_semana, hora_inicio, hora_fin, recurrente) VALUES
('PRO-001', 'SED-001', 'jornada', 1, '08:00', '12:00', true),  -- Lunes mañana
('PRO-001', 'SED-001', 'jornada', 3, '08:00', '12:00', true),  -- Miércoles mañana
('PRO-001', 'SED-001', 'jornada', 5, '08:00', '12:00', true),  -- Viernes mañana
('PRO-002', 'SED-001', 'jornada', 2, '14:00', '18:00', true),  -- Martes tarde
('PRO-002', 'SED-001', 'jornada', 4, '14:00', '18:00', true),  -- Jueves tarde
('PRO-002', 'SED-001', 'jornada', 1, '14:00', '18:00', true),  -- Lunes tarde

-- Pediatría
('PRO-003', 'SED-001', 'jornada', 1, '09:00', '13:00', true),
('PRO-003', 'SED-001', 'jornada', 3, '09:00', '13:00', true),
('PRO-003', 'SED-001', 'jornada', 4, '09:00', '13:00', true),
('PRO-004', 'SED-001', 'jornada', 2, '15:00', '19:00', true),
('PRO-004', 'SED-001', 'jornada', 5, '15:00', '19:00', true),
('PRO-004', 'SED-001', 'jornada', 1, '15:00', '19:00', true),

-- Ginecología
('PRO-005', 'SED-001', 'jornada', 2, '08:00', '12:00', true),
('PRO-005', 'SED-001', 'jornada', 4, '08:00', '12:00', true),
('PRO-005', 'SED-001', 'jornada', 5, '08:00', '12:00', true),
('PRO-006', 'SED-001', 'jornada', 1, '14:00', '18:00', true),
('PRO-006', 'SED-001', 'jornada', 3, '14:00', '18:00', true),
('PRO-006', 'SED-001', 'jornada', 4, '14:00', '18:00', true),

-- Cardiología
('PRO-007', 'SED-001', 'jornada', 2, '08:00', '12:00', true),
('PRO-007', 'SED-001', 'jornada', 4, '08:00', '12:00', true),
('PRO-007', 'SED-001', 'jornada', 5, '08:00', '12:00', true),
('PRO-008', 'SED-001', 'jornada', 1, '14:00', '18:00', true),
('PRO-008', 'SED-001', 'jornada', 3, '14:00', '18:00', true),
('PRO-008', 'SED-001', 'jornada', 5, '14:00', '18:00', true),

-- Psicología
('PRO-009', 'SED-001', 'jornada', 1, '09:00', '13:00', true),
('PRO-009', 'SED-001', 'jornada', 3, '09:00', '13:00', true),
('PRO-009', 'SED-001', 'jornada', 4, '09:00', '13:00', true),
('PRO-010', 'SED-001', 'jornada', 2, '15:00', '19:00', true),
('PRO-010', 'SED-001', 'jornada', 4, '15:00', '19:00', true),
('PRO-010', 'SED-001', 'jornada', 5, '15:00', '19:00', true),

-- Dermatología
('PRO-011', 'SED-001', 'jornada', 2, '08:00', '12:00', true),
('PRO-011', 'SED-001', 'jornada', 4, '08:00', '12:00', true),
('PRO-011', 'SED-001', 'jornada', 5, '08:00', '12:00', true),
('PRO-012', 'SED-001', 'jornada', 1, '14:00', '18:00', true),
('PRO-012', 'SED-001', 'jornada', 3, '14:00', '18:00', true),
('PRO-012', 'SED-001', 'jornada', 4, '14:00', '18:00', true),

-- Centro Médico del Sinú - Medicina General
('PRO-013', 'SED-002', 'jornada', 1, '08:00', '12:00', true),
('PRO-013', 'SED-002', 'jornada', 3, '08:00', '12:00', true),
('PRO-013', 'SED-002', 'jornada', 5, '08:00', '12:00', true),
('PRO-014', 'SED-002', 'jornada', 2, '14:00', '18:00', true),
('PRO-014', 'SED-002', 'jornada', 4, '14:00', '18:00', true),
('PRO-014', 'SED-002', 'jornada', 1, '14:00', '18:00', true),

-- Oftalmología
('PRO-015', 'SED-002', 'jornada', 1, '09:00', '13:00', true),
('PRO-015', 'SED-002', 'jornada', 3, '09:00', '13:00', true),
('PRO-015', 'SED-002', 'jornada', 4, '09:00', '13:00', true),
('PRO-016', 'SED-002', 'jornada', 2, '15:00', '19:00', true),
('PRO-016', 'SED-002', 'jornada', 4, '15:00', '19:00', true),
('PRO-016', 'SED-002', 'jornada', 5, '15:00', '19:00', true),

-- Ortopedia
('PRO-017', 'SED-002', 'jornada', 2, '08:00', '12:00', true),
('PRO-017', 'SED-002', 'jornada', 4, '08:00', '12:00', true),
('PRO-017', 'SED-002', 'jornada', 5, '08:00', '12:00', true),
('PRO-018', 'SED-002', 'jornada', 1, '14:00', '18:00', true),
('PRO-018', 'SED-002', 'jornada', 3, '14:00', '18:00', true),
('PRO-018', 'SED-002', 'jornada', 4, '14:00', '18:00', true),

-- Neurología
('PRO-019', 'SED-002', 'jornada', 1, '08:00', '12:00', true),
('PRO-019', 'SED-002', 'jornada', 3, '08:00', '12:00', true),
('PRO-019', 'SED-002', 'jornada', 5, '08:00', '12:00', true),
('PRO-020', 'SED-002', 'jornada', 2, '14:00', '18:00', true),
('PRO-020', 'SED-002', 'jornada', 4, '14:00', '18:00', true),
('PRO-020', 'SED-002', 'jornada', 5, '14:00', '18:00', true),

-- Endocrinología
('PRO-021', 'SED-002', 'jornada', 2, '08:00', '12:00', true),
('PRO-021', 'SED-002', 'jornada', 4, '08:00', '12:00', true),
('PRO-021', 'SED-002', 'jornada', 5, '08:00', '12:00', true),
('PRO-022', 'SED-002', 'jornada', 1, '14:00', '18:00', true),
('PRO-022', 'SED-002', 'jornada', 3, '14:00', '18:00', true),
('PRO-022', 'SED-002', 'jornada', 4, '14:00', '18:00', true),

-- Oncología
('PRO-023', 'SED-002', 'jornada', 1, '09:00', '13:00', true),
('PRO-023', 'SED-002', 'jornada', 3, '09:00', '13:00', true),
('PRO-023', 'SED-002', 'jornada', 4, '09:00', '13:00', true),
('PRO-024', 'SED-002', 'jornada', 2, '15:00', '19:00', true),
('PRO-024', 'SED-002', 'jornada', 4, '15:00', '19:00', true),
('PRO-024', 'SED-002', 'jornada', 5, '15:00', '19:00', true),

-- Hospital San Jerónimo Norte - Medicina General
('PRO-025', 'SED-003', 'jornada', 1, '08:00', '12:00', true),
('PRO-025', 'SED-003', 'jornada', 3, '08:00', '12:00', true),
('PRO-025', 'SED-003', 'jornada', 5, '08:00', '12:00', true),
('PRO-026', 'SED-003', 'jornada', 2, '14:00', '18:00', true),
('PRO-026', 'SED-003', 'jornada', 4, '14:00', '18:00', true),
('PRO-026', 'SED-003', 'jornada', 1, '14:00', '18:00', true),

-- Medicina Interna
('PRO-027', 'SED-003', 'jornada', 1, '09:00', '13:00', true),
('PRO-027', 'SED-003', 'jornada', 3, '09:00', '13:00', true),
('PRO-027', 'SED-003', 'jornada', 4, '09:00', '13:00', true),
('PRO-028', 'SED-003', 'jornada', 2, '15:00', '19:00', true),
('PRO-028', 'SED-003', 'jornada', 4, '15:00', '19:00', true),
('PRO-028', 'SED-003', 'jornada', 5, '15:00', '19:00', true),

-- Traumatología
('PRO-029', 'SED-003', 'jornada', 2, '08:00', '12:00', true),
('PRO-029', 'SED-003', 'jornada', 4, '08:00', '12:00', true),
('PRO-029', 'SED-003', 'jornada', 5, '08:00', '12:00', true),
('PRO-030', 'SED-003', 'jornada', 1, '14:00', '18:00', true),
('PRO-030', 'SED-003', 'jornada', 3, '14:00', '18:00', true),
('PRO-030', 'SED-003', 'jornada', 4, '14:00', '18:00', true),

-- Urología
('PRO-031', 'SED-003', 'jornada', 1, '08:00', '12:00', true),
('PRO-031', 'SED-003', 'jornada', 3, '08:00', '12:00', true),
('PRO-031', 'SED-003', 'jornada', 5, '08:00', '12:00', true),
('PRO-032', 'SED-003', 'jornada', 2, '14:00', '18:00', true),
('PRO-032', 'SED-003', 'jornada', 4, '14:00', '18:00', true),
('PRO-032', 'SED-003', 'jornada', 5, '14:00', '18:00', true),

-- Gastroenterología
('PRO-033', 'SED-003', 'jornada', 2, '08:00', '12:00', true),
('PRO-033', 'SED-003', 'jornada', 4, '08:00', '12:00', true),
('PRO-033', 'SED-003', 'jornada', 5, '08:00', '12:00', true),
('PRO-034', 'SED-003', 'jornada', 1, '14:00', '18:00', true),
('PRO-034', 'SED-003', 'jornada', 3, '14:00', '18:00', true),
('PRO-034', 'SED-003', 'jornada', 4, '14:00', '18:00', true),

-- Psiquiatría
('PRO-035', 'SED-003', 'jornada', 1, '09:00', '13:00', true),
('PRO-035', 'SED-003', 'jornada', 3, '09:00', '13:00', true),
('PRO-035', 'SED-003', 'jornada', 4, '09:00', '13:00', true),
('PRO-036', 'SED-003', 'jornada', 2, '15:00', '19:00', true),
('PRO-036', 'SED-003', 'jornada', 4, '15:00', '19:00', true),
('PRO-036', 'SED-003', 'jornada', 5, '15:00', '19:00', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- 8. HORARIOS ESPECIALES (Festivos en Colombia)
-- =============================================
INSERT INTO horarios_especiales (sede_id, nombre, fecha, hora_inicio, hora_fin, es_festivo, descripcion) VALUES
-- Festivos comunes en Colombia para 2025
('SED-001', 'Día de la Epifanía', '2025-01-06', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-001', 'Día de San José', '2025-03-24', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-001', 'Jueves Santo', '2025-04-17', '00:00', '23:59', true, 'Semana Santa - Cerrado'),
('SED-001', 'Viernes Santo', '2025-04-18', '00:00', '23:59', true, 'Semana Santa - Cerrado'),
('SED-001', 'Día del Trabajo', '2025-05-01', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-001', 'Independencia de Colombia', '2025-07-20', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-001', 'Batalla de Boyacá', '2025-08-07', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-001', 'Navidad', '2025-12-25', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-001', 'Año Nuevo', '2026-01-01', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),

-- Centro Médico del Sinú (mismos festivos)
('SED-002', 'Día de la Epifanía', '2025-01-06', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-002', 'Día de San José', '2025-03-24', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-002', 'Jueves Santo', '2025-04-17', '00:00', '23:59', true, 'Semana Santa - Cerrado'),
('SED-002', 'Viernes Santo', '2025-04-18', '00:00', '23:59', true, 'Semana Santa - Cerrado'),
('SED-002', 'Día del Trabajo', '2025-05-01', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-002', 'Independencia de Colombia', '2025-07-20', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-002', 'Batalla de Boyacá', '2025-08-07', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-002', 'Navidad', '2025-12-25', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-002', 'Año Nuevo', '2026-01-01', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),

-- Hospital San Jerónimo Norte (mismos festivos)
('SED-003', 'Día de la Epifanía', '2025-01-06', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-003', 'Día de San José', '2025-03-24', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-003', 'Jueves Santo', '2025-04-17', '00:00', '23:59', true, 'Semana Santa - Cerrado'),
('SED-003', 'Viernes Santo', '2025-04-18', '00:00', '23:59', true, 'Semana Santa - Cerrado'),
('SED-003', 'Día del Trabajo', '2025-05-01', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-003', 'Independencia de Colombia', '2025-07-20', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-003', 'Batalla de Boyacá', '2025-08-07', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-003', 'Navidad', '2025-12-25', '00:00', '23:59', true, 'Festivo nacional - Cerrado'),
('SED-003', 'Año Nuevo', '2026-01-01', '00:00', '23:59', true, 'Festivo nacional - Cerrado')
ON CONFLICT DO NOTHING;

-- =============================================
-- 9. CITAS DE EJEMPLO (Para testing)
-- =============================================
INSERT INTO citas (id, user_id, sede_id, servicio_id, servicio, profesional_id, profesional, fecha, hora, estado, qr_code, confirmation_token) VALUES
('CIT-001', 'e0e0e0e0-0000-0000-0000-000000000003', 'SED-001', 'SRV-001', 'Medicina General', 'PRO-001', 'Dr. Juan Carlos Pérez', CURRENT_DATE + INTERVAL '2 days', '09:00', 'confirmada', 'QR-CIT-001', 'token-001'),
('CIT-002', 'e0e0e0e0-0000-0000-0000-000000000003', 'SED-001', 'SRV-002', 'Pediatría', 'PRO-003', 'Dr. Carlos Alberto Martínez', CURRENT_DATE + INTERVAL '3 days', '10:30', 'confirmada', 'QR-CIT-002', 'token-002'),
('CIT-003', 'e0e0e0e0-0000-0000-0000-000000000004', 'SED-002', 'SRV-008', 'Oftalmología', 'PRO-015', 'Dr. Hernán Augusto Jiménez', CURRENT_DATE + INTERVAL '5 days', '14:00', 'pendiente', 'QR-CIT-003', 'token-003'),
('CIT-004', 'e0e0e0e0-0000-0000-0000-000000000005', 'SED-003', 'SRV-013', 'Medicina General', 'PRO-025', 'Dr. Jaime Alberto Mejía', CURRENT_DATE + INTERVAL '7 days', '09:00', 'confirmada', 'QR-CIT-004', 'token-004'),
('CIT-005', 'e0e0e0e0-0000-0000-0000-000000000006', 'SED-001', 'SRV-004', 'Cardiología', 'PRO-007', 'Dr. Jorge Luis Herrera', CURRENT_DATE + INTERVAL '10 days', '11:00', 'pendiente', 'QR-CIT-005', 'token-005')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 10. TURNOS DE EJEMPLO
-- =============================================
INSERT INTO turnos (id, user_id, paciente, sede_id, servicio_id, servicio, numero, cola, estado, tiempo_estimado, qr_code) VALUES
('TUR-001', 'e0e0e0e0-0000-0000-0000-000000000003', 'Carlos Andrés Pérez', 'SED-001', 'SRV-001', 'Medicina General', 15, 'Cola Medicina General - Mañana', 'en_espera', 30, 'QR-TUR-001'),
('TUR-002', 'e0e0e0e0-0000-0000-0000-000000000004', 'María Fernanda Ruiz', 'SED-002', 'SRV-007', 'Medicina General', 23, 'Cola Medicina General', 'en_atencion', 30, 'QR-TUR-002'),
('TUR-003', 'e0e0e0e0-0000-0000-0000-000000000005', 'José David Martínez', 'SED-003', 'SRV-013', 'Medicina General', 12, 'Cola Medicina General', 'en_espera', 30, 'QR-TUR-003')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 11. ROLES (Sistema de permisos)
-- =============================================
INSERT INTO roles (id, nombre, descripcion, nivel) VALUES
('ROL-001', 'Administrador', 'Acceso completo al sistema', 10),
('ROL-002', 'Recepcionista', 'Atención al cliente y citas', 5),
('ROL-003', 'Usuario', 'Acceso básico del paciente', 1),
('ROL-004', 'Médico', 'Acceso a historiales y citas propias', 3)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 12. PERMISOS (Definiciones de permisos)
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
('p018', 'configuracion', 'editar', 'Editar configuración'),
('p019', 'analitica', 'ver', 'Ver analítica'),
('p020', 'disponibilidad', 'gestionar', 'Gestionar disponibilidad')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 13. ROLES PERMISOS (Asignación de permisos)
-- =============================================
-- Administrador: todos los permisos
INSERT INTO roles_permisos (role_id, permiso_id) VALUES
('ROL-001', 'p001'), ('ROL-001', 'p002'), ('ROL-001', 'p003'), ('ROL-001', 'p004'), ('ROL-001', 'p005'),
('ROL-001', 'p006'), ('ROL-001', 'p007'), ('ROL-001', 'p008'), ('ROL-001', 'p009'),
('ROL-001', 'p010'), ('ROL-001', 'p011'), ('ROL-001', 'p012'), ('ROL-001', 'p013'),
('ROL-001', 'p014'), ('ROL-001', 'p015'), ('ROL-001', 'p016'),
('ROL-001', 'p017'), ('ROL-001', 'p018'), ('ROL-001', 'p019'), ('ROL-001', 'p020'),

-- Recepcionista: citas y turnos
('ROL-002', 'p001'), ('ROL-002', 'p002'), ('ROL-002', 'p004'),
('ROL-002', 'p006'), ('ROL-002', 'p007'), ('ROL-002', 'p009'),

-- Médico: ver citas y reportes
('ROL-004', 'p004'), ('ROL-004', 'p017')
ON CONFLICT DO NOTHING;

-- =============================================
-- 14. PLANTILLAS DE MENSAJES
-- =============================================
INSERT INTO plantillas_mensajes (nombre, tipo, categoria, asunto, contenido, variables_disponibles, activa) VALUES
('Recordatorio Cita', 'email', 'recordatorio', 'Recordatorio de Cita - {{fecha}}', 
'Estimado/a {{nombre}}, le recordamos su cita el día {{fecha}} a las {{hora}} en {{sede}} ({{direccion}}). Por favor, confirme su asistencia.',
ARRAY['{{nombre}}', '{{fecha}}', '{{hora}}', '{{sede}}', '{{direccion}}'], true),

('Confirmación Cita', 'email', 'confirmacion', 'Confirmación de Cita - Citaverde',
'Su cita ha sido confirmada para el día {{fecha}} a las {{hora}}. Su código de cita es: {{codigo}}.',
ARRAY['{{nombre}}', '{{fecha}}', '{{hora}}', '{{codigo}}'], true),

('Turno Listo SMS', 'sms', 'turno_listo', NULL,
'Su turno está listo. Acérquese a la ventanilla {{numero}}. Tiempo estimado: {{tiempo}} min.',
ARRAY['{{nombre}}', '{{numero}}', '{{tiempo}}'], true),

('Cancelación Cita', 'email', 'cancelacion', 'Cita Cancelada - Citaverde',
'Su cita programada para el día {{fecha}} ha sido cancelada. Si desea reprogramar, por favor visite nuestra plataforma.',
ARRAY['{{nombre}}', '{{fecha}}', '{{motivo}}'], true),

('Recordatorio WhatsApp', 'whatsapp', 'recordatorio', NULL,
'Hola {{nombre}}, te recordamos tu cita el {{fecha}} a las {{hora}}. Confirma tu asistencia respondiendo CONFIRMAR.',
ARRAY['{{nombre}}', '{{fecha}}', '{{hora}}'], true)
ON CONFLICT DO NOTHING;

-- =============================================
-- 15. LOGS QR (Historial de escaneos)
-- =============================================
INSERT INTO logs_qr (qr_code, cita_id, usuario_id, ip_address, dispositivo, resultado) VALUES
('QR-CIT-001', 'CIT-001', 'e0e0e0e0-0000-0000-0000-000000000003', '190.184.123.45', 'Android', 'exitoso'),
('QR-CIT-002', 'CIT-002', 'e0e0e0e0-0000-0000-0000-000000000003', '186.84.234.56', 'iOS', 'fallido'),
('QR-TUR-001', NULL, 'e0e0e0e0-0000-0000-0000-000000000003', '190.184.123.45', 'Android', 'exitoso'),
('QR-TUR-002', NULL, 'e0e0e0e0-0000-0000-0000-000000000004', '186.84.234.56', 'iOS', 'usado')
ON CONFLICT DO NOTHING;

-- =============================================
-- 16. CONFIGURACIÓN DEL SISTEMA
-- =============================================
INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES
('checkin_ventana_minima', '15', 'number', 'Minutos antes de la cita para permitir check-in'),
('checkin_ventana_maxima', '60', 'number', 'Minutos antes de la cita máxima para check-in'),
('timezone', 'America/Bogota', 'string', 'Zona horaria del sistema (Colombia)'),
('idioma', 'es', 'string', 'Idioma del sistema'),
('reporte_diario_activo', 'true', 'boolean', 'Si el reporte diario está activo'),
('reporte_diario_email', 'admin@reservaflow.co', 'string', 'Email para reportes diarios'),
('reporte_semanal_activo', 'false', 'boolean', 'Si el reporte semanal está activo'),
('reporte_semanal_email', '', 'string', 'Email para reportes semanales'),
('reporte_mensual_activo', 'false', 'boolean', 'Si el reporte mensual está activo'),
('reporte_mensual_email', '', 'string', 'Email para reportes mensuales'),
('sla_tiempo_atencion_default', '30', 'number', 'Tiempo por defecto de atención en minutos'),
('sla_tiempo_espera_default', '45', 'number', 'Tiempo máximo de espera por defecto en minutos')
ON CONFLICT (clave) DO NOTHING;

-- =============================================
-- 17. USUARIOS ADICIONALES PARA TESTING
-- =============================================
INSERT INTO usuarios (id, email, name, password, role, sede_id) VALUES
-- Pacientes adicionales (10 más)
('e0e0e0e0-0000-0000-0000-000000000008', 'paciente6@reservaflow.co', 'Ana María Herrera', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000009', 'paciente7@reservaflow.co', 'Roberto Carlos Soto', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000012', 'paciente8@reservaflow.co', 'Claudia Liliana Vargas', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000013', 'paciente9@reservaflow.co', 'Fernando Andrés Montes', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000014', 'paciente10@reservaflow.co', 'Lucía Esperanza Ochoa', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000015', 'paciente11@reservaflow.co', 'Daniel Alonso Rico', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000016', 'paciente12@reservaflow.co', 'Valentina Andrea Castro', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000017', 'paciente13@reservaflow.co', 'Juan Sebastián Londoño', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000018', 'paciente14@reservaflow.co', 'Sofía Alejandra Betancur', 'paciente123', 'usuario', NULL),
('e0e0e0e0-0000-0000-0000-000000000019', 'paciente15@reservaflow.co', 'Esteban Ríos Molina', 'paciente123', 'usuario', NULL)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 18. COLAS ADICIONALES (Para los otros servicios)
-- =============================================
INSERT INTO colas (id, name, servicio_id, prioridad, is_active, is_cerrada, turnos_actuales, tiempo_estimado_total) VALUES
-- Servicios faltantes de Los Rosales
('COL-013', 'Cola Psicología', 'SRV-005', 'baja', true, false, 0, 100),
('COL-014', 'Cola Dermatología', 'SRV-006', 'media', true, false, 0, 60),

-- Servicios faltantes del Centro Médico del Sinú
('COL-015', 'Cola Endocrinología', 'SRV-011', 'media', true, false, 0, 70),
('COL-016', 'Cola Oncología', 'SRV-012', 'alta', true, false, 0, 120),

-- Servicios faltantes de San Jerónimo Norte
('COL-017', 'Cola Urología', 'SRV-016', 'media', true, false, 0, 70),
('COL-018', 'Cola Psiquiatría', 'SRV-018', 'baja', true, false, 0, 100)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 19. CITAS ADICIONALES (Más variedad)
-- =============================================
INSERT INTO citas (id, user_id, sede_id, servicio_id, servicio, profesional_id, profesional, fecha, hora, estado, qr_code, confirmation_token) VALUES
('CIT-006', 'e0e0e0e0-0000-0000-0000-000000000004', 'SED-001', 'SRV-006', 'Dermatología', 'PRO-011', 'Dr. Luis Fernando Castro', CURRENT_DATE + INTERVAL '1 days', '10:00', 'confirmada', 'QR-CIT-006', 'token-006'),
('CIT-007', 'e0e0e0e0-0000-0000-0000-000000000005', 'SED-002', 'SRV-009', 'Ortopedia', 'PRO-017', 'Dr. Fabio Nelson Agudelo', CURRENT_DATE + INTERVAL '4 days', '15:00', 'pendiente', 'QR-CIT-007', 'token-007'),
('CIT-008', 'e0e0e0e0-0000-0000-0000-000000000006', 'SED-003', 'SRV-015', 'Traumatología', 'PRO-029', 'Dr. Víctor Manuel Cardona', CURRENT_DATE + INTERVAL '6 days', '11:00', 'confirmada', 'QR-CIT-008', 'token-008'),
('CIT-009', 'e0e0e0e0-0000-0000-0000-000000000007', 'SED-001', 'SRV-005', 'Psicología', 'PRO-009', 'Dr. Roberto Andrés Díaz', CURRENT_DATE + INTERVAL '8 days', '09:30', 'pendiente', 'QR-CIT-009', 'token-009'),
('CIT-010', 'e0e0e0e0-0000-0000-0000-000000000008', 'SED-002', 'SRV-012', 'Oncología', 'PRO-023', 'Dr. Carlos Mario Zapata', CURRENT_DATE + INTERVAL '12 days', '14:00', 'confirmada', 'QR-CIT-010', 'token-010'),
('CIT-011', 'e0e0e0e0-0000-0000-0000-000000000009', 'SED-003', 'SRV-017', 'Gastroenterología', 'PRO-033', 'Dr. José María Higuita', CURRENT_DATE + INTERVAL '15 days', '10:00', 'confirmada', 'QR-CIT-011', 'token-011'),
('CIT-012', 'e0e0e0e0-0000-0000-0000-000000000012', 'SED-001', 'SRV-003', 'Ginecología', 'PRO-005', 'Dr. Eduardo Sánchez', CURRENT_DATE + INTERVAL '9 days', '11:30', 'pendiente', 'QR-CIT-012', 'token-012'),
('CIT-013', 'e0e0e0e0-0000-0000-0000-000000000013', 'SED-002', 'SRV-010', 'Neurología', 'PRO-019', 'Dr. Oscar David Restrepo', CURRENT_DATE + INTERVAL '11 days', '08:00', 'confirmada', 'QR-CIT-013', 'token-013')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 20. TURNOS ADICIONALES
-- =============================================
INSERT INTO turnos (id, user_id, paciente, sede_id, servicio_id, servicio, numero, cola, estado, tiempo_estimado, qr_code) VALUES
('TUR-004', 'e0e0e0e0-0000-0000-0000-000000000006', 'Laura Tatiana Gómez', 'SED-001', 'SRV-002', 'Pediatría', 8, 'Cola Pediatría - Tarde', 'en_espera', 25, 'QR-TUR-004'),
('TUR-005', 'e0e0e0e0-0000-0000-0000-000000000007', 'Pedro Alonso Díaz', 'SED-002', 'SRV-008', 'Oftalmología', 5, 'Cola Oftalmología', 'en_espera', 35, 'QR-TUR-005'),
('TUR-006', 'e0e0e0e0-0000-0000-0000-000000000008', 'Ana María Herrera', 'SED-003', 'SRV-015', 'Traumatología', 3, 'Cola Traumatología', 'en_atencion', 45, 'QR-TUR-006'),
('TUR-007', 'e0e0e0e0-0000-0000-0000-000000000009', 'Roberto Carlos Soto', 'SED-001', 'SRV-005', 'Psicología', 2, 'Cola Psicología', 'en_espera', 50, 'QR-TUR-007')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- FIN DE DATOS DE EJEMPLO
-- =============================================
