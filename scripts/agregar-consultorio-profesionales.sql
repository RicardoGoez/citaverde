-- =============================================
-- Agregar campo consultorio_id a profesionales
-- =============================================
-- Este script agrega la relación entre profesionales y consultorios

-- Agregar columna consultorio_id a la tabla profesionales
ALTER TABLE profesionales 
ADD COLUMN IF NOT EXISTS consultorio_id TEXT;

-- Agregar comentario a la columna
COMMENT ON COLUMN profesionales.consultorio_id IS 'ID del consultorio asignado al profesional';

-- Crear índice para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_profesionales_consultorio_id ON profesionales(consultorio_id);

-- =============================================
-- Agregar campos consultorio_id y consultorio a citas
-- =============================================
-- Agregar columna consultorio_id a la tabla citas
ALTER TABLE citas 
ADD COLUMN IF NOT EXISTS consultorio_id TEXT;

-- Agregar columna consultorio (nombre) a la tabla citas
ALTER TABLE citas 
ADD COLUMN IF NOT EXISTS consultorio TEXT;

-- Agregar comentarios
COMMENT ON COLUMN citas.consultorio_id IS 'ID del consultorio donde se realizará la cita';
COMMENT ON COLUMN citas.consultorio IS 'Nombre del consultorio donde se realizará la cita';

-- Crear índices para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_citas_consultorio_id ON citas(consultorio_id);

-- =============================================
-- Ejemplo de asignación de consultorios a profesionales
-- =============================================
-- Puedes ejecutar estos comandos para asignar consultorios a profesionales
-- basándote en sus servicios

-- Ejemplo: Asignar consultorios a profesionales de Medicina General
-- UPDATE profesionales 
-- SET consultorio_id = 'REC-001' 
-- WHERE id = 'PRO-001' AND sede_id = 'SED-001';

-- UPDATE profesionales 
-- SET consultorio_id = 'REC-002' 
-- WHERE id = 'PRO-002' AND sede_id = 'SED-001';

-- Nota: Ajusta los IDs según tu estructura de datos

