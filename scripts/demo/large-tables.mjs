import { SCHOOL, MARKER } from './plan.mjs';
export const idFunction = `CREATE OR REPLACE FUNCTION pg_temp.demo_id(k text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  WITH h AS (SELECT encode(sha256(convert_to('${MARKER}:'||k,'UTF8')),'hex') v)
  SELECT (substr(v,1,8)||'-'||substr(v,9,4)||'-4'||substr(v,14,3)||'-a'||substr(v,18,3)||'-'||substr(v,21,12))::uuid FROM h;
$$;\n`;
export function generatedIds(table,plan) {
  if(table==='attendance'||table==='teacher_attendance')return `SELECT pg_temp.demo_id('${table}:'||i||':'||d) FROM generate_series(0,${table==='attendance'?179:19}) i CROSS JOIN generate_series(-44,0) d`;
  if(table==='fee_records')return `SELECT pg_temp.demo_id('fee_records:'||i||':'||to_char(date_trunc('month','${plan.anchor}'::date)-m*interval '1 month','YYYY-MM')) FROM generate_series(0,179) i CROSS JOIN generate_series(0,5) m`;
  if(table==='exam_marks')return `SELECT pg_temp.demo_id('exam_marks:'||ei||':'||(CASE WHEN i/15+1<=8 THEN i/15 ELSE 8+(i/15-8)*2+CASE WHEN i%15>=8 THEN 1 ELSE 0 END END)||':'||si||':'||i) FROM generate_series(0,179) i CROSS JOIN generate_series(0,2) ei CROSS JOIN generate_series(0,5) si`;
  return null;
}
export function largeTableSql(table,plan) {
  const anchor=`'${plan.anchor}'::date`;
  if(table==='attendance')return `
    INSERT INTO public.attendance(id,school_id,student_id,student_name,class_name,section,attendance_date,status,created_at)
    WITH source AS (SELECT s.*,right(s.name,3)::int-1 i,d,${anchor}+d attendance_day FROM public.students s CROSS JOIN generate_series(-44,0) d WHERE s.school_id='${SCHOOL}')
    SELECT pg_temp.demo_id('attendance:'||i||':'||d),'${SCHOOL}',id,name,class,section,attendance_day,
      CASE WHEN (i<7 AND (d+44)%3<>0) OR (i>=7 AND (i*13+(d+44)*7)%100<5+(d+44)%6) THEN 'absent' WHEN (i*13+(d+44)*7)%100<16 THEN 'late' ELSE 'present' END,
      (attendance_day::text||'T10:15:00+05:45')::timestamptz
    FROM source WHERE extract(dow FROM attendance_day)<>6 AND created_at::date<=attendance_day
    ON CONFLICT(id) DO NOTHING;\n`;
  if(table==='teacher_attendance')return `
    INSERT INTO public.teacher_attendance(id,school_id,teacher_id,attendance_date,status,check_in,check_out,notes,created_at,updated_at)
    WITH source AS (SELECT t.*,right(t.name,3)::int-1 i,d,${anchor}+d attendance_day FROM public.teachers t CROSS JOIN generate_series(-44,0) d WHERE t.school_id='${SCHOOL}'),
    status_rows AS (SELECT s.*,CASE WHEN EXISTS (SELECT 1 FROM public.teacher_leave_requests l WHERE l.teacher_id=s.id AND l.status='approved' AND l.start_date<=s.attendance_day AND l.end_date>=s.attendance_day) THEN 'leave' WHEN (i*7+d+44)%23<2 THEN 'absent' ELSE 'present' END mark_status FROM source s)
    SELECT pg_temp.demo_id('teacher_attendance:'||i||':'||d),'${SCHOOL}',id,attendance_day,mark_status,
      CASE WHEN mark_status='present' THEN '09:45'::time END,CASE WHEN mark_status='present' AND d<0 THEN '15:30'::time END,
      CASE WHEN mark_status='leave' THEN 'Approved demo leave' ELSE 'Demo attendance ${MARKER}' END,
      (attendance_day::text||'T10:00:00+05:45')::timestamptz,(attendance_day::text||'T10:00:00+05:45')::timestamptz
    FROM status_rows WHERE extract(dow FROM attendance_day)<>6 AND (left_at IS NULL OR left_at>attendance_day)
    ON CONFLICT(id) DO NOTHING;\n`;
  if(table==='fee_records')return `
    INSERT INTO public.fee_records(id,school_id,student_id,fee_type_id,student_name,fee_name,amount,payment_date,payment_method,receipt_number,notes,created_at)
    WITH source AS (SELECT s.*,right(s.name,3)::int-1 i,m,to_char(date_trunc('month',${anchor})-m*interval '1 month','YYYY-MM') month_key FROM public.students s CROSS JOIN generate_series(0,5) m WHERE s.school_id='${SCHOOL}'),
    amounts AS (SELECT *,CASE WHEN (i+m*3)%10<6 THEN 3000 ELSE 1500 END paid,(month_key||'-'||lpad(least(extract(day FROM ${anchor})::int,5+i%20)::text,2,'0'))::date payment_day FROM source WHERE (i+m*3)%10<8)
    SELECT pg_temp.demo_id('fee_records:'||i||':'||month_key),'${SCHOOL}',id,
      CASE WHEN paid<>3000 THEN pg_temp.demo_id('fee_types:monthly') END,name,CASE WHEN paid=3000 THEN 'Monthly school fees' ELSE 'Monthly Tuition' END,
      paid,payment_day,CASE WHEN i%2=1 THEN 'cash' ELSE 'bank_transfer' END,'DEMO-'||replace(month_key,'-','')||'-'||lpad((i+1)::text,3,'0'),
      '${MARKER}; tuition '||CASE WHEN paid=3000 THEN '2500' ELSE '1500' END||' + activity '||CASE WHEN paid=3000 THEN '500' ELSE '0' END,
      (payment_day::text||'T11:00:00+05:45')::timestamptz FROM amounts WHERE created_at::date<=payment_day
    ON CONFLICT(id) DO NOTHING;\n`;
  if(table==='exam_marks')return `
    INSERT INTO public.exam_marks(id,school_id,subject_id,student_id,marks,updated_at)
    WITH source AS (SELECT s.id subject_id,st.id student_id,e.end_date,ei,right(st.name,3)::int-1 i,
      array_position(ARRAY['Nepali','English','Mathematics','Science','Social Studies','Computer Science'],s.subject_name)-1 si,
      CASE WHEN st.class::int<=8 THEN st.class::int-1 ELSE 8+(st.class::int-9)*2+CASE WHEN st.section='B' THEN 1 ELSE 0 END END gi
      FROM public.exam_subjects s JOIN public.exams e ON e.id=s.exam_id JOIN generate_series(0,2) ei ON e.id=pg_temp.demo_id('exams:'||ei)
      JOIN public.students st ON st.school_id=s.school_id AND st.class=s.class_name AND coalesce(st.section,'')=s.section
      WHERE s.school_id='${SCHOOL}' AND e.published_at IS NULL),
    marks_rows AS (SELECT pg_temp.demo_id('exam_marks:'||ei||':'||gi||':'||si||':'||i) id,* FROM source WHERE ei<>2 OR (i+si)%5<>0)
    SELECT id,'${SCHOOL}',subject_id,student_id,
      greatest(15,least(98,(CASE WHEN i<7 THEN 25+i*2 ELSE 45+(i*11)%44 END)+((i+si*7+ei*3)%17)-8+ei*3)),
      ((end_date+2)::text||'T09:30:00+05:45')::timestamptz FROM marks_rows r WHERE NOT EXISTS(SELECT 1 FROM public.exam_marks old WHERE old.id=r.id)
    ON CONFLICT(id) DO NOTHING;\n`;
  return null;
}
