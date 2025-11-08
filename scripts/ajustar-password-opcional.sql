-- =============================================
-- HACER CAMPO PASSWORD OPCIONAL PARA SUPABASE AUTH
-- =============================================
-- Este script hace que el campo password sea opcional
-- ya que ahora usamos Supabase Auth para autenticación
-- =============================================

-- Hacer el campo password nullable (opcional)
ALTER TABLE usuarios 
ALTER COLUMN password DROP NOT NULL;

-- Agregar un valor por defecto para usuarios existentes que no tengan password
-- (solo si usan Supabase Auth)
UPDATE usuarios 
SET password = 'supabase_auth_user' 
WHERE password IS NULL;

-- Comentario
COMMENT ON COLUMN usuarios.password IS 'Contraseña (NULL si usa Supabase Auth, valor dummy si es usuario de Auth)';

