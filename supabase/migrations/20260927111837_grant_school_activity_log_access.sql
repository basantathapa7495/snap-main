-- PostgREST needs table privileges in addition to the existing school-scoped RLS policies.
-- Recent Activity reads admission approvals; approving an admission writes the log.
grant select, insert on table public.activity_logs to authenticated;
