-- Private one-time challenges for Resend school registration. Only the server's service role may access them.
create table if not exists public.school_email_challenges (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  request_ip_hash text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  consumed_at timestamptz
);

create index if not exists school_email_challenges_email_issued_idx on public.school_email_challenges (email, issued_at desc);
create index if not exists school_email_challenges_ip_issued_idx on public.school_email_challenges (request_ip_hash, issued_at desc);
alter table public.school_email_challenges enable row level security;
revoke all on public.school_email_challenges from anon, authenticated;
grant select, insert, update, delete on public.school_email_challenges to service_role;
