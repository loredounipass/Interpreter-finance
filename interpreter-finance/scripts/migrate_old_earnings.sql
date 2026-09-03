-- Este script actualiza todos los registros antiguos en daily_logs que tengan earnings en 0 o nulo.
-- Para calcularlo, busca la tarifa (rate_per_minute) de la meta (goal) que estaba activa en la fecha de ese log.

UPDATE daily_logs dl
SET earnings = round((dl.minutes * COALESCE(
  -- 1. Intenta obtener la tarifa que estaba activa ese mismo día o antes
  (
    SELECT rate_per_minute
    FROM goals g
    WHERE g.user_id = dl.user_id 
      AND g.starts_on <= dl.logged_on
    ORDER BY g.starts_on DESC
    LIMIT 1
  ),
  -- 2. Si el log es más viejo que cualquier meta, usa la tarifa de la primera meta que haya creado el usuario
  (
    SELECT rate_per_minute
    FROM goals g
    WHERE g.user_id = dl.user_id
    ORDER BY g.starts_on ASC
    LIMIT 1
  ),
  -- 3. Si por alguna razón no hay ninguna meta, usa 0.13 por defecto
  0.13
))::numeric, 2)
WHERE dl.earnings = 0 OR dl.earnings IS NULL;
