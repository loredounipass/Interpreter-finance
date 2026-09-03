-- Este script inserta la meta histórica que faltaba en la tabla goals.
-- Sin este registro, la app cree que antes de hoy (Sept 3) no existía ninguna meta,
-- lo que causa que el chart, calendario y earnings no funcionen correctamente para días pasados.

-- 1. Insertar la meta histórica de 560 min/día que cubra desde Aug 31 hasta Sept 2
--    (Necesitamos el user_id de la meta actual para asociarla al mismo usuario)
INSERT INTO goals (user_id, daily_minutes, work_hours, rate_per_minute, starts_on, is_active, created_at, updated_at)
SELECT 
  user_id,
  560,              -- meta anterior: 560 minutos
  work_hours,       -- mismas horas de trabajo
  rate_per_minute,  -- misma tarifa
  '2026-08-31',     -- desde el primer día con logs
  false,            -- no es la meta activa (es histórica)
  now(),
  now()
FROM goals
WHERE is_active = true
LIMIT 1;

-- 2. Verificación: ahora deberías tener 2 registros en goals:
--    - Uno con starts_on = 2026-08-31, daily_minutes = 560, is_active = false (histórico)
--    - Uno con starts_on = 2026-09-03, daily_minutes = 620, is_active = true  (actual)
-- 
-- La función getGoalForDate ahora podrá resolver correctamente:
--   Aug 31 → 560 min
--   Sept 1 → 560 min  
--   Sept 2 → 560 min
--   Sept 3 → 620 min (hoy en adelante)
