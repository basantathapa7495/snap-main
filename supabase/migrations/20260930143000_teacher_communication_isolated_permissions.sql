
-- Additive Teacher Communication schema.
-- Principal communication tables, views, policies and UI remain unchanged.

alter table public.notices
  add column if not exists target_class_id uuid references public.classes(id) on delete set null,
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_mime text,
  add column if not exists attachment_size bigint;

alter table public.notices
  drop constraint if exists notices_attachment_size_valid;
alter table public.notices
  add constraint notices_attachment_size_valid
  check (attachment_size is null or attachment_size between 1 and 10485760);

create index if not exists notices_teacher_created_idx
  on public.notices (school_id, created_by, created_at desc);
create index if not exists notices_target_class_id_idx
  on public.notices (target_class_id, status, created_at desc);

create policy "Teachers read notices they created"
on public.notices for select to authenticated
using (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.teachers t
    where t.user_id = (select auth.uid())
      and t.school_id = notices.school_id
      and t.left_at is null
  )
);

create policy "Teachers create notices for assigned classes"
on public.notices for insert to authenticated
with check (
  created_by = (select auth.uid())
  and target_audience in ('class','section')
  and target_class_id is not null
  and status in ('published','scheduled','draft')
  and (status <> 'scheduled' or scheduled_at > now())
  and exists (
    select 1
    from public.teachers t
    join public.teacher_assignments ta
      on ta.teacher_id = t.id
     and ta.school_id = t.school_id
     and ta.active
    join public.classes c
      on c.id = ta.class_id
     and c.school_id = ta.school_id
     and c.archived_at is null
    where t.user_id = (select auth.uid())
      and t.school_id = notices.school_id
      and t.left_at is null
      and c.id = notices.target_class_id
  )
);

create policy "Teachers update notices for assigned classes"
on public.notices for update to authenticated
using (
  created_by = (select auth.uid())
  and exists (
    select 1 from public.teachers t
    where t.user_id = (select auth.uid())
      and t.school_id = notices.school_id
      and t.left_at is null
  )
)
with check (
  created_by = (select auth.uid())
  and target_audience in ('class','section')
  and target_class_id is not null
  and status in ('published','scheduled','draft')
  and (status <> 'scheduled' or scheduled_at > now())
  and exists (
    select 1
    from public.teachers t
    join public.teacher_assignments ta
      on ta.teacher_id = t.id
     and ta.school_id = t.school_id
     and ta.active
    join public.classes c
      on c.id = ta.class_id
     and c.school_id = ta.school_id
     and c.archived_at is null
    where t.user_id = (select auth.uid())
      and t.school_id = notices.school_id
      and t.left_at is null
      and c.id = notices.target_class_id
  )
);

create policy "Teachers delete notices for assigned classes"
on public.notices for delete to authenticated
using (
  created_by = (select auth.uid())
  and target_class_id is not null
  and exists (
    select 1
    from public.teachers t
    join public.teacher_assignments ta
      on ta.teacher_id = t.id
     and ta.school_id = t.school_id
     and ta.active
    where t.user_id = (select auth.uid())
      and t.school_id = notices.school_id
      and t.left_at is null
      and ta.class_id = notices.target_class_id
  )
);

create table public.teacher_student_conversations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_student_conversation_unique unique (school_id,teacher_id,student_id,class_id)
);

create table public.teacher_student_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.teacher_student_conversations(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(btrim(content)) between 1 and 5000),
  attachment_path text,
  attachment_name text,
  attachment_mime text,
  attachment_size bigint check (attachment_size is null or attachment_size between 1 and 10485760),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index teacher_student_conversations_teacher_recent_idx
  on public.teacher_student_conversations (teacher_id,updated_at desc);
create index teacher_student_conversations_student_recent_idx
  on public.teacher_student_conversations (student_id,updated_at desc);
create index teacher_student_messages_history_idx
  on public.teacher_student_messages (conversation_id,created_at desc,id desc);
create index teacher_student_messages_unread_idx
  on public.teacher_student_messages (conversation_id,sender_id)
  where read_at is null;

alter table public.teacher_student_conversations enable row level security;
alter table public.teacher_student_messages enable row level security;

create policy "Assigned teachers read student conversations"
on public.teacher_student_conversations for select to authenticated
using (
  exists (
    select 1
    from public.teachers t
    join public.teacher_assignments ta
      on ta.teacher_id = t.id
     and ta.school_id = t.school_id
     and ta.active
    where t.id = teacher_student_conversations.teacher_id
      and t.user_id = (select auth.uid())
      and t.school_id = teacher_student_conversations.school_id
      and t.left_at is null
      and ta.class_id = teacher_student_conversations.class_id
  )
);

create policy "Students read their teacher conversations"
on public.teacher_student_conversations for select to authenticated
using (
  exists (
    select 1 from public.students s
    where s.id = teacher_student_conversations.student_id
      and s.user_id = (select auth.uid())
      and s.school_id = teacher_student_conversations.school_id
  )
);

create policy "Assigned teachers start student conversations"
on public.teacher_student_conversations for insert to authenticated
with check (
  exists (
    select 1
    from public.teachers t
    join public.teacher_assignments ta
      on ta.teacher_id = t.id
     and ta.school_id = t.school_id
     and ta.active
    join public.classes c
      on c.id = ta.class_id
     and c.school_id = ta.school_id
     and c.archived_at is null
    join public.students s
      on s.id = teacher_student_conversations.student_id
     and s.school_id = teacher_student_conversations.school_id
    where t.id = teacher_student_conversations.teacher_id
      and t.user_id = (select auth.uid())
      and t.school_id = teacher_student_conversations.school_id
      and t.left_at is null
      and c.id = teacher_student_conversations.class_id
      and lower(regexp_replace(btrim(s.class), '^(class|grade)[[:space:]]+', '', 'i'))
        = lower(regexp_replace(btrim(coalesce(c.class_name,c.class,c.name,c.class_number)), '^(class|grade)[[:space:]]+', '', 'i'))
      and lower(btrim(coalesce(s.section,'')))
        = lower(btrim(coalesce(c.section_name,c.section,'')))
  )
);

create policy "Conversation members read teacher student messages"
on public.teacher_student_messages for select to authenticated
using (
  exists (
    select 1
    from public.teacher_student_conversations c
    left join public.teachers t on t.id = c.teacher_id
    left join public.students s on s.id = c.student_id
    where c.id = teacher_student_messages.conversation_id
      and c.school_id = teacher_student_messages.school_id
      and (
        (
          t.user_id = (select auth.uid())
          and t.left_at is null
          and exists (
            select 1 from public.teacher_assignments ta
            where ta.teacher_id = t.id
              and ta.school_id = c.school_id
              and ta.class_id = c.class_id
              and ta.active
          )
        )
        or s.user_id = (select auth.uid())
      )
  )
);

create policy "Conversation members send teacher student messages"
on public.teacher_student_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and read_at is null
  and exists (
    select 1
    from public.teacher_student_conversations c
    left join public.teachers t on t.id = c.teacher_id
    left join public.students s on s.id = c.student_id
    where c.id = teacher_student_messages.conversation_id
      and c.school_id = teacher_student_messages.school_id
      and (
        (
          t.user_id = (select auth.uid())
          and t.left_at is null
          and exists (
            select 1 from public.teacher_assignments ta
            where ta.teacher_id = t.id
              and ta.school_id = c.school_id
              and ta.class_id = c.class_id
              and ta.active
          )
        )
        or s.user_id = (select auth.uid())
      )
  )
);

create policy "Conversation recipients mark teacher student messages read"
on public.teacher_student_messages for update to authenticated
using (
  sender_id <> (select auth.uid())
  and read_at is null
  and exists (
    select 1
    from public.teacher_student_conversations c
    left join public.teachers t on t.id = c.teacher_id
    left join public.students s on s.id = c.student_id
    where c.id = teacher_student_messages.conversation_id
      and c.school_id = teacher_student_messages.school_id
      and (
        (
          t.user_id = (select auth.uid())
          and t.left_at is null
          and exists (
            select 1 from public.teacher_assignments ta
            where ta.teacher_id = t.id
              and ta.school_id = c.school_id
              and ta.class_id = c.class_id
              and ta.active
          )
        )
        or s.user_id = (select auth.uid())
      )
  )
)
with check (
  sender_id <> (select auth.uid())
  and read_at is not null
);

create policy "Message senders attach their own files"
on public.teacher_student_messages for update to authenticated
using (
  sender_id = (select auth.uid())
  and exists (
    select 1
    from public.teacher_student_conversations c
    left join public.teachers t on t.id = c.teacher_id
    left join public.students s on s.id = c.student_id
    where c.id = teacher_student_messages.conversation_id
      and c.school_id = teacher_student_messages.school_id
      and (
        (
          t.user_id = (select auth.uid())
          and t.left_at is null
          and exists (
            select 1 from public.teacher_assignments ta
            where ta.teacher_id = t.id
              and ta.school_id = c.school_id
              and ta.class_id = c.class_id
              and ta.active
          )
        )
        or s.user_id = (select auth.uid())
      )
  )
)
with check (sender_id = (select auth.uid()));

revoke all on public.teacher_student_conversations, public.teacher_student_messages
  from anon, authenticated;
grant select on public.teacher_student_conversations to authenticated;
grant insert (school_id,teacher_id,student_id,class_id)
  on public.teacher_student_conversations to authenticated;
grant select on public.teacher_student_messages to authenticated;
grant insert (id,conversation_id,school_id,sender_id,content,attachment_path,attachment_name,attachment_mime,attachment_size)
  on public.teacher_student_messages to authenticated;
grant update (read_at,attachment_path,attachment_name,attachment_mime,attachment_size)
  on public.teacher_student_messages to authenticated;

create or replace function private.touch_teacher_student_conversation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.teacher_student_conversations
  set updated_at = new.created_at
  where id = new.conversation_id;
  return new;
end $$;
revoke all on function private.touch_teacher_student_conversation()
  from public,anon,authenticated;

create trigger teacher_student_message_touch_conversation
after insert on public.teacher_student_messages
for each row execute function private.touch_teacher_student_conversation();

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'teacher-communication',
  'teacher-communication',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Teachers upload teacher communication files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'teacher-communication'
  and (storage.foldername(name))[4] = (select auth.uid())::text
  and (storage.foldername(name))[2] in ('notices','messages')
  and exists (
    select 1 from public.teachers t
    where t.user_id = (select auth.uid())
      and t.school_id::text = (storage.foldername(name))[1]
      and t.left_at is null
  )
  and (
    (storage.foldername(name))[2] = 'notices'
    or (
      (storage.foldername(name))[3] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and exists (
        select 1
        from public.teacher_student_conversations c
        join public.teachers t on t.id = c.teacher_id
        join public.teacher_assignments ta
          on ta.teacher_id = t.id
         and ta.school_id = c.school_id
         and ta.class_id = c.class_id
         and ta.active
        where c.id = ((storage.foldername(name))[3])::uuid
          and c.school_id::text = (storage.foldername(name))[1]
          and t.user_id = (select auth.uid())
          and t.left_at is null
      )
    )
  )
);

create policy "Authorized members read teacher notice files"
on storage.objects for select to authenticated
using (
  bucket_id = 'teacher-communication'
  and (storage.foldername(name))[2] = 'notices'
  and exists (
    select 1
    from public.notices n
    where n.attachment_path = storage.objects.name
      and (
        n.created_by = (select auth.uid())
        or exists (
          select 1 from public.profiles p
          where p.user_id = (select auth.uid())
            and p.school_id = n.school_id
            and p.role = 'admin'
        )
        or (
          n.status = 'published'
          and n.target_audience in ('teachers','all')
          and exists (
            select 1 from public.teachers t
            where t.user_id = (select auth.uid())
              and t.school_id = n.school_id
              and t.left_at is null
          )
        )
        or (
          n.status = 'published'
          and n.target_audience in ('students','class','section')
          and exists (
            select 1 from public.students s
            where s.user_id = (select auth.uid())
              and s.school_id = n.school_id
              and (
                n.target_audience = 'students'
                or (
                  lower(regexp_replace(btrim(s.class), '^(class|grade)[[:space:]]+', '', 'i'))
                    = lower(regexp_replace(btrim(n.target_class), '^(class|grade)[[:space:]]+', '', 'i'))
                  and (
                    n.target_audience = 'class'
                    or lower(btrim(coalesce(s.section,''))) = lower(btrim(coalesce(n.target_section,'')))
                  )
                )
              )
          )
        )
      )
  )
);

create policy "Conversation members read teacher message files"
on storage.objects for select to authenticated
using (
  bucket_id = 'teacher-communication'
  and (storage.foldername(name))[2] = 'messages'
  and exists (
    select 1
    from public.teacher_student_messages m
    join public.teacher_student_conversations c on c.id = m.conversation_id
    left join public.teachers t on t.id = c.teacher_id
    left join public.students s on s.id = c.student_id
    where m.attachment_path = storage.objects.name
      and (
        (
          t.user_id = (select auth.uid())
          and t.left_at is null
          and exists (
            select 1 from public.teacher_assignments ta
            where ta.teacher_id = t.id
              and ta.school_id = c.school_id
              and ta.class_id = c.class_id
              and ta.active
          )
        )
        or s.user_id = (select auth.uid())
      )
  )
);

create policy "Teachers delete own teacher communication files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'teacher-communication'
  and (storage.foldername(name))[4] = (select auth.uid())::text
  and exists (
    select 1 from public.teachers t
    where t.user_id = (select auth.uid())
      and t.school_id::text = (storage.foldername(name))[1]
      and t.left_at is null
  )
);
