-- Limit attempts against shared six-digit codes across all app instances.
-- Store only an HMAC of the client address + school, never the raw address.
create table public.school_join_attempts (
  key_hash text not null,
  window_start timestamptz not null,
  attempts integer not null default 1 check (attempts > 0),
  primary key (key_hash, window_start)
);
create index school_join_attempts_window_idx on public.school_join_attempts (window_start);
alter table public.school_join_attempts enable row level security;
revoke all on public.school_join_attempts from public, anon, authenticated;
grant select, insert, update, delete on public.school_join_attempts to service_role;

create function public.consume_school_join_attempt(p_key_hash text, p_limit integer default 10)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  bucket timestamptz := to_timestamp(floor(extract(epoch from now()) / 900) * 900);
  current_attempts integer;
begin
  if p_key_hash !~ '^[0-9a-f]{64}$' or p_limit < 1 or p_limit > 100 then return false; end if;
  insert into public.school_join_attempts (key_hash, window_start, attempts)
  values (p_key_hash, bucket, 1)
  on conflict (key_hash, window_start) do update
    set attempts = school_join_attempts.attempts + 1
  returning attempts into current_attempts;
  return current_attempts <= p_limit;
end;
$$;
revoke all on function public.consume_school_join_attempt(text, integer) from public, anon, authenticated;
grant execute on function public.consume_school_join_attempt(text, integer) to service_role;
