grant delete on table public.direct_messages to authenticated;

create policy "School principals delete conversation messages"
on public.direct_messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.direct_conversations c
    join public.profiles p
      on p.user_id = (select auth.uid())
     and p.school_id = c.school_id
     and p.role = 'admin'
    where c.id = direct_messages.conversation_id
      and c.school_id = direct_messages.school_id
      and c.principal_id = (select auth.uid())
  )
);
