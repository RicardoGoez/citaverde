-- =============================================
-- SOLUCIÓN COMPLETA DE PERMISOS - CITA VERDE
-- =============================================
-- Este script deshabilita RLS y otorga permisos
-- a todas las tablas del sistema
-- =============================================

-- =============================================
-- PASO 1: DESHABILITAR RLS EN TODAS LAS TABLAS
-- =============================================
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE sedes DISABLE ROW LEVEL SECURITY;
ALTER TABLE servicios DISABLE ROW LEVEL SECURITY;
ALTER TABLE profesionales DISABLE ROW LEVEL SECURITY;
ALTER TABLE citas DISABLE ROW LEVEL SECURITY;
ALTER TABLE turnos DISABLE ROW LEVEL SECURITY;
ALTER TABLE colas DISABLE ROW LEVEL SECURITY;
ALTER TABLE recursos DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs_qr DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE permisos DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles_permisos DISABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilidad DISABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_especiales DISABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_mensajes DISABLE ROW LEVEL SECURITY;

-- =============================================
-- PASO 2: OTORGAR PERMISOS DE LECTURA A ANON
-- =============================================
GRANT SELECT ON usuarios TO anon;
GRANT SELECT ON sedes TO anon;
GRANT SELECT ON servicios TO anon;
GRANT SELECT ON profesionales TO anon;
GRANT SELECT ON citas TO anon;
GRANT SELECT ON turnos TO anon;
GRANT SELECT ON colas TO anon;
GRANT SELECT ON recursos TO anon;
GRANT SELECT ON logs_qr TO anon;
GRANT SELECT ON roles TO anon;
GRANT SELECT ON permisos TO anon;
GRANT SELECT ON roles_permisos TO anon;
GRANT SELECT ON disponibilidad TO anon;
GRANT SELECT ON horarios_especiales TO anon;
GRANT SELECT ON plantillas_mensajes TO anon;

-- Otorgar permisos de inserción, actualización y eliminación
GRANT INSERT, UPDATE, DELETE ON usuarios TO anon;
GRANT INSERT, UPDATE, DELETE ON sedes TO anon;
GRANT INSERT, UPDATE, DELETE ON servicios TO anon;
GRANT INSERT, UPDATE, DELETE ON profesionales TO anon;
GRANT INSERT, UPDATE, DELETE ON citas TO anon;
GRANT INSERT, UPDATE, DELETE ON turnos TO anon;
GRANT INSERT, UPDATE, DELETE ON colas TO anon;
GRANT INSERT, UPDATE, DELETE ON recursos TO anon;
GRANT INSERT, UPDATE, DELETE ON logs_qr TO anon;
GRANT INSERT, UPDATE, DELETE ON roles TO anon;
GRANT INSERT, UPDATE, DELETE ON permisos TO anon;
GRANT INSERT, UPDATE, DELETE ON roles_permisos TO anon;
GRANT INSERT, UPDATE, DELETE ON disponibilidad TO anon;
GRANT INSERT, UPDATE, DELETE ON horarios_especiales TO anon;
GRANT INSERT, UPDATE, DELETE ON plantillas_mensajes TO anon;

-- =============================================
-- PASO 3: OTORGAR PERMISOS A USUARIOS AUTENTICADOS
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sedes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON servicios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profesionales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON citas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON turnos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON colas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recursos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON logs_qr TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON permisos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON roles_permisos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON disponibilidad TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON horarios_especiales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON plantillas_mensajes TO authenticated;

-- =============================================
-- PASO 4: VERIFICAR ESTADO
-- =============================================
-- Ver estado de RLS
SELECT 
    'ESTADO DE RLS' as informacion,
    tablename,
    CASE 
        WHEN rowsecurity THEN 'HABILITADO' 
        ELSE 'DESHABILITADO' 
    END as estado_rls
FROM pg_tables 
WHERE tablename IN (
    'usuarios', 'sedes', 'servicios', 'profesionales', 'citas', 
    'turnos', 'colas', 'recursos', 'logs_qr', 'roles', 
    'permisos', 'roles_permisos', 'disponibilidad', 'horarios_especiales', 
    'plantillas_mensajes'
)
AND schemaname = 'public'
ORDER BY tablename;

-- =============================================
-- FIN DEL SCRIPT
-- =============================================
