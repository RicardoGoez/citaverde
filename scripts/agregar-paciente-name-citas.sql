-- Agregar columna paciente_name a la tabla citas
-- Esta columna permite almacenar el nombre del paciente cuando la cita se crea manualmente desde recepción

ALTER TABLE citas 
ADD COLUMN IF NOT EXISTS paciente_name TEXT;

-- Comentario para documentar la columna
COMMENT ON COLUMN citas.paciente_name IS 'Nombre del paciente cuando la cita se crea manualmente desde recepción (para citas sin usuario registrado)';

