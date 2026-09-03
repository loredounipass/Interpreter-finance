-- Este script actualiza cualquier registro de daily_logs que haya quedado marcado como 'is_active = true'
-- y los pasa todos a 'false', dejando el historial completamente uniforme como bloques completados.

UPDATE daily_logs
SET is_active = false
WHERE is_active = true;
