create or replace function public.prevent_attendance_on_approved_leave() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status<>'leave' and exists(select 1 from public.teacher_leave_requests r where r.teacher_id=new.teacher_id and r.school_id=new.school_id and r.status='approved' and new.attendance_date between r.start_date and r.end_date) then raise exception 'Teacher has approved leave for this date';end if;
 return new;
end $$;
