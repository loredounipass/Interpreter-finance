-- clean_tables.sql
-- Limpia daily_logs y goals (no borra profiles ni auth.users).
-- Seguro de correr varias veces (TRUNCATE con RESTART IDENTITY).

-- daily_logs tiene ON DELETE CASCADE hacia profiles, pero como solo
-- vaciamos daily_logs y goals (no profiles), el perfil del usuario queda intacto.
truncate table public.daily_logs restart identity;
truncate table public.goals restart identity;

-- Si en el futuro quisieras limpiar TODO excepto el perfil, agrega aquí
-- otras tablas de datos (nunca truncar profiles ni auth.users).
