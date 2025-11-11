-- =============================================
-- AGREGAR VERIFICACIÓN DE EMAIL A USUARIOS
-- =============================================
-- Este script agrega los campos necesarios para
-- la verificación de email en la tabla usuarios
-- =============================================

-- Agregar campos de verificación de email
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS token_verificacion TEXT,
ADD COLUMN IF NOT EXISTS token_verificacion_expiracion TIMESTAMP WITH TIME ZONE;

-- Crear índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacion 
ON usuarios(token_verificacion) 
WHERE token_verificacion IS NOT NULL;

-- Marcar usuarios existentes como verificados (para no afectar el sistema actual)
-- En producción, podrías querer que todos verifiquen su email
UPDATE usuarios 
SET email_verificado = true 
WHERE email_verificado IS NULL OR email_verificado = false;

-- Comentarios
COMMENT ON COLUMN usuarios.email_verificado IS 'Indica si el email del usuario ha sido verificado';
COMMENT ON COLUMN usuarios.token_verificacion IS 'Token único para verificar el email del usuario';
COMMENT ON COLUMN usuarios.token_verificacion_expiracion IS 'Fecha y hora de expiración del token de verificación';

