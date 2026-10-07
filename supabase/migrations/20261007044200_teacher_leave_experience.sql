create table public.school_leave_types (
 id uuid primary key default gen_random_uuid(),
 school_id uuid not null references public.schools(id) on delete cascade,
 code text not null check(code~'^[a-z0-9_-]{1,40}$'),
 name text not null check(char_length(btrim(name)) between 1 and 80),
 allocation_days integer check(allocation_days is null or allocation_days>=0),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(school_id,code)
);
insert into public.school_leave_types(school_id,code,name)
select distinct school_id,lower(regexp_replace(btrim(leave_type),'[^a-zA-Z0-9]+','_','g')),
 initcap(replace(lower(regexp_replace(btrim(leave_type),'[^a-zA-Z0-9]+','_','g')),'_',' '))
from public.teacher_leave_requests where btrim(leave_type)<>''
on conflict(school_id,code) do nothing;
alter table public.school_leave_types enable row level security;
grant select,insert,update,delete on public.school_leave_types to authenticated;
create policy "School members read leave types" on public.school_leave_types for select to authenticated using(exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.school_id=school_leave_types.school_id));
create policy "School managers manage leave types" on public.school_leave_types for all to authenticated using(private.is_school_admin(school_id)) with check(private.is_school_admin(school_id));

alter table public.teacher_leave_requests
 add column total_days integer not null default 1 check(total_days>0),
 add column attachment_path text,
 add column attachment_name text,
 add column attachment_mime text,
 add column attachment_size bigint check(attachment_size is null or attachment_size between 1 and 10485760),
 add column cancelled_at timestamptz;
alter table public.teacher_leave_requests drop constraint teacher_leave_requests_status_check;
alter table public.teacher_leave_requests add constraint teacher_leave_requests_status_check check(status in('pending','approved','rejected','clarification','cancelled'));
alter table public.teacher_leave_requests add constraint teacher_leave_reason_length check(char_length(btrim(reason)) between 5 and 1000);

create function private.leave_working_days(p_school uuid,p_start date,p_end date) returns integer language sql stable security definer set search_path='' as $$
 with configured as(select distinct weekday::int weekday_num from public.teacher_assignments where school_id=p_school and active and weekday is not null),
 dates as(select d::date date_value from generate_series(p_start,p_end,interval '1 day') d)
 select greatest(1,count(*)::int) from dates d where
  (not exists(select 1 from configured) or extract(dow from d.date_value)::int in(select weekday_num from configured))
  and not exists(select 1 from public.news_events e where e.school_id=p_school and e.is_event and e.category='holiday' and d.date_value between e.event_date and coalesce(e.end_date,e.event_date))
$$;
revoke all on function private.leave_working_days(uuid,date,date) from public,anon,authenticated;

create function public.guard_teacher_leave_request() returns trigger language plpgsql security definer set search_path='' as $$
declare allocation integer; consumed integer; is_manager boolean;
begin
 is_manager:=private.is_school_admin(new.school_id);
 if tg_op='UPDATE' and not is_manager then
  if old.status='pending' and new.status='cancelled' then
   if new.teacher_id<>old.teacher_id or new.school_id<>old.school_id or new.leave_type<>old.leave_type or new.start_date<>old.start_date or new.end_date<>old.end_date or new.reason<>old.reason or new.principal_note is distinct from old.principal_note or new.reviewed_by is distinct from old.reviewed_by or new.reviewed_at is distinct from old.reviewed_at then raise exception 'Only pending request cancellation is allowed'; end if;
   new.cancelled_at:=now();
  elsif old.status='clarification' and new.status='pending' then
   new.reviewed_by:=null;new.reviewed_at:=null;
  else raise exception 'Teachers cannot change approval status'; end if;
 end if;
 if is_manager and tg_op='UPDATE' and new.status is distinct from old.status and new.status in('approved','rejected','clarification') then new.reviewed_by:=(select auth.uid());new.reviewed_at:=now();end if;
 new.total_days:=private.leave_working_days(new.school_id,new.start_date,new.end_date);
 if new.status in('pending','approved','clarification') and exists(select 1 from public.teacher_leave_requests r where r.teacher_id=new.teacher_id and r.id<>new.id and r.status in('pending','approved','clarification') and daterange(r.start_date,r.end_date,'[]')&&daterange(new.start_date,new.end_date,'[]')) then raise exception 'Leave dates overlap an existing request';end if;
 select allocation_days into allocation from public.school_leave_types where school_id=new.school_id and code=new.leave_type and active;
 if allocation is not null and new.status in('pending','approved') then
  select coalesce(sum(total_days),0) into consumed from public.teacher_leave_requests r where r.teacher_id=new.teacher_id and r.leave_type=new.leave_type and r.id<>new.id and r.status in('pending','approved') and extract(year from r.start_date)=extract(year from new.start_date);
  if consumed+new.total_days>allocation then raise exception 'Insufficient leave balance';end if;
 end if;
 return new;
end $$;
revoke all on function public.guard_teacher_leave_request() from public,anon,authenticated;
create trigger guard_teacher_leave_request before insert or update on public.teacher_leave_requests for each row execute function public.guard_teacher_leave_request();

create policy "Teachers cancel pending leave requests" on public.teacher_leave_requests for update to authenticated using(status='pending' and exists(select 1 from public.teachers t where t.id=teacher_leave_requests.teacher_id and t.user_id=(select auth.uid()))) with check(status='cancelled' and exists(select 1 from public.teachers t where t.id=teacher_leave_requests.teacher_id and t.user_id=(select auth.uid())));

create function public.prevent_attendance_on_approved_leave() returns trigger language plpgsql set search_path='' as $$
begin if new.status<>'leave' and exists(select 1 from public.teacher_leave_requests r where r.teacher_id=new.teacher_id and r.school_id=new.school_id and r.status='approved' and new.attendance_date between r.start_date and r.end_date) then raise exception 'Teacher has approved leave for this date';end if;return new;end $$;
revoke all on function public.prevent_attendance_on_approved_leave() from public,anon,authenticated;
create trigger prevent_attendance_on_approved_leave before insert or update on public.teacher_attendance for each row execute function public.prevent_attendance_on_approved_leave();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('teacher-leave','teacher-leave',false,10485760,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "Teachers upload own leave files" on storage.objects for insert to authenticated with check(bucket_id='teacher-leave' and (storage.foldername(name))[1] in(select t.school_id::text from public.teachers t where t.user_id=(select auth.uid())) and (storage.foldername(name))[2]=(select auth.uid())::text);
create policy "Leave participants read attachments" on storage.objects for select to authenticated using(bucket_id='teacher-leave' and exists(select 1 from public.teacher_leave_requests r join public.teachers t on t.id=r.teacher_id where r.attachment_path=storage.objects.name and (t.user_id=(select auth.uid()) or private.is_school_admin(r.school_id))));
create policy "Teachers delete own pending leave files" on storage.objects for delete to authenticated using(bucket_id='teacher-leave' and (storage.foldername(name))[2]=(select auth.uid())::text);
create index school_leave_types_school_active_idx on public.school_leave_types(school_id,active);
create index teacher_leave_teacher_dates_idx on public.teacher_leave_requests(teacher_id,start_date,end_date);
