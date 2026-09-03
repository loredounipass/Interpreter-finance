-- PASO 1: Verificar el estado actual de la tabla goals
SELECT id, starts_on, daily_minutes, is_active, rate_per_minute FROM goals ORDER BY starts_on ASC;

-- PASO 2: Asegurar que la meta histórica (Aug 31, 560 min) está en FALSE
-- y la meta actual (Sept 3, 620 min) está en TRUE
UPDATE goals SET is_active = false WHERE starts_on = '2026-08-31';
UPDATE goals SET is_active = true  WHERE starts_on = '2026-09-03';

-- PASO 3: Verificar que quedó bien
SELECT id, starts_on, daily_minutes, is_active, rate_per_minute FROM goals ORDER BY starts_on ASC;
