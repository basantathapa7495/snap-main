-- School joining uses the service role after verifying codes and reviewer identity
-- on the server. Keep account requests unavailable to browser roles.
revoke all on table public.account_requests from anon, authenticated;
grant select, insert, update, delete on table public.account_requests to service_role;
