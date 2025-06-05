-- ====================================================================
-- SCRIPT DE LIMPIEZA: BORRAR EVENTOS Y MEETINGS
-- ====================================================================
-- Este script elimina todos los eventos y meetings pero conserva:
-- - Usuarios
-- - Integraciones 
-- - Calendarios de usuario (user_calendars)
-- - Configuración de disponibilidad (availability y day_availability)
-- ====================================================================

-- IMPORTANTE: Hacer backup antes de ejecutar este script
-- pg_dump -U usuario -h localhost -d calendars -t meetings -t events > backup_events_meetings.sql

BEGIN;

-- ====================================================================
-- 1. VERIFICACIÓN PREVIA - Ver qué se va a eliminar
-- ====================================================================

-- Mostrar estadísticas actuales
SELECT 'ESTADÍSTICAS ANTES DE LA LIMPIEZA' as info;

SELECT 
    'meetings' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as programadas,
    COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as canceladas
FROM meetings
UNION ALL
SELECT 
    'events' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN "isPrivate" = true THEN 1 END) as privados,
    COUNT(CASE WHEN "isPrivate" = false THEN 1 END) as publicos
FROM events;

-- Mostrar meetings por usuario (para referencia)
SELECT 
    u.name as usuario,
    u.email,
    COUNT(m.id) as total_meetings,
    COUNT(CASE WHEN m.status = 'SCHEDULED' THEN 1 END) as programadas
FROM users u
LEFT JOIN meetings m ON u.id = m."userId"
GROUP BY u.id, u.name, u.email
ORDER BY u.name;

-- Mostrar eventos por usuario (para referencia)
SELECT 
    u.name as usuario,
    u.email,
    COUNT(e.id) as total_eventos,
    STRING_AGG(e.title, ', ') as eventos
FROM users u
LEFT JOIN events e ON u.id = e."userId"
GROUP BY u.id, u.name, u.email
ORDER BY u.name;

-- ====================================================================
-- 2. ELIMINACIÓN EN ORDEN CORRECTO (respetando FK constraints)
-- ====================================================================

-- Primero eliminar meetings (tienen FK a events)
DELETE FROM meetings;

-- Luego eliminar events
DELETE FROM events;

-- ====================================================================
-- 3. VERIFICACIÓN POST-LIMPIEZA
-- ====================================================================

-- Verificar que las tablas están vacías
SELECT 'VERIFICACIÓN POST-LIMPIEZA' as info;

SELECT 
    'meetings' as tabla,
    COUNT(*) as registros_restantes
FROM meetings
UNION ALL
SELECT 
    'events' as tabla,
    COUNT(*) as registros_restantes
FROM events;

-- Verificar que los datos del usuario se mantuvieron
SELECT 'DATOS CONSERVADOS' as info;

SELECT 
    'users' as tabla,
    COUNT(*) as total
FROM users
UNION ALL
SELECT 
    'integrations' as tabla,
    COUNT(*) as total
FROM integrations
UNION ALL
SELECT 
    'user_calendars' as tabla,
    COUNT(*) as total
FROM user_calendars
UNION ALL
SELECT 
    'availability' as tabla,
    COUNT(*) as total
FROM availability
UNION ALL
SELECT 
    'day_availability' as tabla,
    COUNT(*) as total
FROM day_availability;

-- Mostrar usuarios que permanecen
SELECT 
    u.name as usuario,
    u.email,
    u.username,
    CASE WHEN i.id IS NOT NULL THEN 'SI' ELSE 'NO' END as tiene_integraciones,
    CASE WHEN uc.id IS NOT NULL THEN 'SI' ELSE 'NO' END as tiene_calendarios
FROM users u
LEFT JOIN integrations i ON u.id = i."userId"
LEFT JOIN user_calendars uc ON u.id = uc.user_id
GROUP BY u.id, u.name, u.email, u.username, i.id, uc.id
ORDER BY u.name;

-- ====================================================================
-- 4. RESET DE SECUENCIAS (opcional)
-- ====================================================================

-- PostgreSQL no usa AUTO_INCREMENT sino UUID, pero podríamos limpiar estadísticas
-- ANALYZE meetings;
-- ANALYZE events;

COMMIT;

-- ====================================================================
-- 5. SCRIPT ALTERNATIVO: ELIMINACIÓN SELECTIVA
-- ====================================================================

-- Si quieres eliminar solo meetings/events de un usuario específico:
/*
BEGIN;

-- Eliminar meetings de un usuario específico
DELETE FROM meetings 
WHERE "userId" = (SELECT id FROM users WHERE email = 'usuario@ejemplo.com');

-- Eliminar events de un usuario específico  
DELETE FROM events 
WHERE "userId" = (SELECT id FROM users WHERE email = 'usuario@ejemplo.com');

COMMIT;
*/

-- ====================================================================
-- 6. SCRIPT ALTERNATIVO: ELIMINACIÓN POR FECHAS
-- ====================================================================

-- Si quieres eliminar solo meetings/events antiguos:
/*
BEGIN;

-- Eliminar meetings anteriores a una fecha
DELETE FROM meetings 
WHERE "createdAt" < '2024-01-01 00:00:00';

-- Eliminar events que no tienen meetings asociados y son antiguos
DELETE FROM events 
WHERE "createdAt" < '2024-01-01 00:00:00'
AND id NOT IN (SELECT DISTINCT "eventId" FROM meetings WHERE "eventId" IS NOT NULL);

COMMIT;
*/

-- ====================================================================
-- 7. VERIFICACIÓN FINAL DE INTEGRIDAD
-- ====================================================================

-- Verificar que no hay referencias huérfanas
SELECT 'VERIFICACIÓN DE INTEGRIDAD' as info;

-- Verificar users sin availability (no debería haber)
SELECT COUNT(*) as users_sin_availability
FROM users u
LEFT JOIN availability a ON u."availabilityId" = a.id
WHERE a.id IS NULL;

-- Verificar integrations sin usuario (no debería haber)
SELECT COUNT(*) as integrations_huerfanas
FROM integrations i
LEFT JOIN users u ON i."userId" = u.id
WHERE u.id IS NULL;

-- Verificar user_calendars sin usuario (no debería haber)
SELECT COUNT(*) as calendars_huerfanos
FROM user_calendars uc
LEFT JOIN users u ON uc.user_id = u.id
WHERE u.id IS NULL;

-- ====================================================================
-- 8. REPORTE FINAL
-- ====================================================================

SELECT 
    'LIMPIEZA COMPLETADA EXITOSAMENTE' as resultado,
    'Eventos y meetings eliminados, datos de usuario conservados' as detalle,
    NOW() as fecha_limpieza;