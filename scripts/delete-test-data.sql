-- Script para eliminar datos de prueba
-- Ejecutar con: npx prisma db execute --file scripts/delete-test-data.sql

-- Eliminar reseñas de prueba (tienen IDs que empiezan con 'test_' o googleReviewId con 'TEST_')
DELETE FROM reviews WHERE "googleReviewId" LIKE 'TEST_%';

-- Eliminar ubicaciones de prueba
DELETE FROM locations WHERE "googleLocationId" LIKE 'TEST_%';

-- Confirmar eliminación
SELECT 'Datos de prueba eliminados' AS resultado;
