-- Private one-to-one school conversations. Recipient records remain in teachers/students.
create table public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  principal_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  recipient_role text not null check (recipient_role in ('teacher', 'student')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint direct_conversation_distinct_users check (principal_id <> recipient_id),
  constraint direct_conversation_unique_pair unique (school_id, principal_id, recipient_id)
);

create table public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(btrim(content)) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index direct_conversations_principal_recent_idx on public.direct_conversations (principal_id, updated_at desc);
create index direct_conversations_recipient_recent_idx on public.direct_conversations (recipient_id, updated_at desc);
create index direct_messages_history_idx on public.direct_messages (conversation_id, created_at desc, id desc);
create index direct_messages_unread_idx on public.direct_messages (conversation_id, sender_id) where read_at is null;

alter table public.direct_conversations enable row level security;
alter table public.direct_messages enable row level security;

-- A participant keeps access only while their school membership is valid.
create policy "Participants see their school conversation" on public.direct_conversations
  for select to authenticated using (
    (principal_id = (select auth.uid()) and exists (
      select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.school_id = direct_conversations.school_id and p.role = 'admin'
    ))
    or (recipient_id = (select auth.uid()) and (
      (recipient_role = 'teacher' and exists (
        select 1 from public.teachers t where t.user_id = (select auth.uid()) and t.school_id = direct_conversations.school_id
      )) or (recipient_role = 'student' and exists (
        select 1 from public.students s where s.user_id = (select auth.uid()) and s.school_id = direct_conversations.school_id
      ))
    ))
  );

create policy "Principal starts a school conversation" on public.direct_conversations
  for insert to authenticated with check (
    principal_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.user_id = (select auth.uid()) and p.school_id = direct_conversations.school_id and p.role = 'admin')
    and (
      (recipient_role = 'teacher' and exists (select 1 from public.teachers t where t.user_id = direct_conversations.recipient_id and t.school_id = direct_conversations.school_id and t.left_at is null))
      or (recipient_role = 'student' and exists (select 1 from public.students s where s.user_id = direct_conversations.recipient_id and s.school_id = direct_conversations.school_id))
    )
  );

create policy "Participants read messages" on public.direct_messages
  for select to authenticated using (
    exists (select 1 from public.direct_conversations c where c.id = direct_messages.conversation_id and c.school_id = direct_messages.school_id
      and (c.principal_id = (select auth.uid()) or c.recipient_id = (select auth.uid())))
  );

create policy "Participants send their own messages" on public.direct_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid()) and read_at is null
    and exists (select 1 from public.direct_conversations c where c.id = direct_messages.conversation_id and c.school_id = direct_messages.school_id
      and (c.principal_id = (select auth.uid()) or c.recipient_id = (select auth.uid())))
  );

create policy "Recipient marks message read" on public.direct_messages
  for update to authenticated
  using (read_at is null and sender_id <> (select auth.uid()) and exists (
    select 1 from public.direct_conversations c where c.id = direct_messages.conversation_id and c.school_id = direct_messages.school_id
      and (c.principal_id = (select auth.uid()) or c.recipient_id = (select auth.uid()))
  ))
  with check (read_at is not null and sender_id <> (select auth.uid()) and exists (
    select 1 from public.direct_conversations c where c.id = direct_messages.conversation_id and c.school_id = direct_messages.school_id
      and (c.principal_id = (select auth.uid()) or c.recipient_id = (select auth.uid()))
  ));

-- The database owns the conversation's recency; clients cannot forge it.
create function public.touch_direct_conversation() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.direct_conversations set updated_at = new.created_at where id = new.conversation_id;
  return new;
end $$;
create trigger direct_message_touch_conversation after insert on public.direct_messages
  for each row execute function public.touch_direct_conversation();
revoke all on function public.touch_direct_conversation() from public, anon, authenticated;

-- Invoker view keeps RLS on both source tables, including message previews.
create view public.direct_conversation_inbox with (security_invoker = true) as
select c.id, c.school_id, c.principal_id, c.recipient_id, c.recipient_role, c.created_at, c.updated_at,
  latest.content as latest_content, latest.sender_id as latest_sender_id, latest.created_at as latest_at,
  (select count(*)::integer from public.direct_messages m where m.conversation_id = c.id and m.sender_id <> (select auth.uid()) and m.read_at is null) as unread_count
from public.direct_conversations c
left join lateral (
  select m.content, m.sender_id, m.created_at from public.direct_messages m
  where m.conversation_id = c.id order by m.created_at desc, m.id desc limit 1
) latest on true;

revoke all on public.direct_conversations, public.direct_messages, public.direct_conversation_inbox from anon, authenticated;
grant select on public.direct_conversations to authenticated;
grant insert (school_id, principal_id, recipient_id, recipient_role) on public.direct_conversations to authenticated;
grant select on public.direct_messages to authenticated;
grant insert (conversation_id, school_id, sender_id, content) on public.direct_messages to authenticated;
grant update (read_at) on public.direct_messages to authenticated;
grant select on public.direct_conversation_inbox to authenticated;
