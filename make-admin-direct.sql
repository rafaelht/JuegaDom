-- Script para hacer administrador a un usuario específico
-- Ejecutar este script en el SQL Editor de Supabase

-- Reemplaza 'tu-email@ejemplo.com' con tu email real
UPDATE public.users 
SET is_admin = true 
WHERE email = 'rafaelhilariotorres@gmail.com';

-- Verificar que se actualizó correctamente
SELECT 
  id,
  username,
  email,
  is_admin,
  created_at
FROM public.users 
WHERE email = 'rafaelhilariotorres@gmail.com';

-- Mostrar todos los administradores
SELECT 
  id,
  username,
  email,
  is_admin,
  created_at
FROM public.users 
WHERE is_admin = true
ORDER BY created_at DESC;

-- Mostrar todos los usuarios para verificar
SELECT 
  id,
  username,
  email,
  is_admin,
  created_at
FROM public.users 
ORDER BY created_at DESC; 