import { SCHOOL, SCHOOL_NAME, SLUG, MARKER, PRINCIPAL } from './plan.mjs';
import { idFunction, largeTableSql, generatedIds } from './large-tables.mjs';

const quote = value => value === null || value === undefined ? 'NULL' : typeof value==='number'?String(value):typeof value==='boolean'?String(value):`'${(Array.isArray(value)?`{${value.map(v=>`"${v.replaceAll('"','\\"')}"`).join(',')}}`:typeof value==='object'?JSON.stringify(value):String(value)).replaceAll("'","''")}'`;
const ident = value => `"${value.replaceAll('"','""')}"`;
export function seedSql(plan, reset=false) {
  const tables=Object.keys(plan.rows);
  const guard = `DO $guard$ BEGIN
    IF EXISTS (SELECT 1 FROM public.schools WHERE (id = '${SCHOOL}' AND (name IS DISTINCT FROM ${quote(SCHOOL_NAME)} OR slug IS DISTINCT FROM '${SLUG}' OR short_description IS NULL OR short_description NOT LIKE '${MARKER}%')) OR (slug = '${SLUG}' AND id <> '${SCHOOL}')) THEN RAISE EXCEPTION 'Demo school ownership mismatch; nothing changed'; END IF;
    IF EXISTS (SELECT 1 FROM public.profiles WHERE school_id='${SCHOOL}' AND user_id NOT IN (${plan.accounts.filter(a=>a.status==='approved').map(a=>quote(a.id)).join(',')})) THEN RAISE EXCEPTION 'Unexpected demo member; manual review required'; END IF;
  END $guard$;`;
  const ids = table => generatedIds(table,plan)||plan.rows[table].map(r=>quote(r.id)).join(',');
  const checks = tables.filter(t=>t!=='schools').map(table=>`IF EXISTS (SELECT 1 FROM public.${ident(table)} WHERE id IN (${ids(table)}) AND school_id IS DISTINCT FROM '${SCHOOL}'::uuid) THEN RAISE EXCEPTION 'Seed ID collision in ${table}'; END IF;`).join('\n');
  // Snapshot all other tenants without exposing their rows. Changes roll back on mismatch.
  const snapshots=tables.map(table=>`SELECT '${table}'::text table_name, count(*) n, md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' ORDER BY id),'')) fingerprint FROM public.${ident(table)} t WHERE ${table==='schools'?'id':'school_id'} IS DISTINCT FROM '${SCHOOL}'::uuid`).join(' UNION ALL ');
  let sql=`BEGIN;\nSELECT pg_advisory_xact_lock(hashtextextended('${MARKER}',0));\n${idFunction}${guard}\nDO $check$ BEGIN ${checks} END $check$;\nCREATE TEMP TABLE demo_others_before ON COMMIT DROP AS ${snapshots};\n`;
  if(reset) {
    sql+=`CREATE TEMP TABLE demo_owned_ids(table_name text,id uuid) ON COMMIT DROP;
      ${tables.filter(t=>t!=='schools').map(table=>generatedIds(table,plan)?`INSERT INTO demo_owned_ids SELECT '${table}',generated_id FROM (${generatedIds(table,plan).replace('SELECT pg_temp.demo_id','SELECT pg_temp.demo_id').replace(' FROM generate_series',' AS generated_id FROM generate_series')}) expected;`:`INSERT INTO demo_owned_ids VALUES ${plan.rows[table].map(r=>`('${table}','${r.id}')`).join(',')};`).join('\n')}
    `;
    // Reset refuses any manual additions or cross-tenant references, so cascades
    // cannot remove records that were not in this deterministic seed manifest.
    sql+=`DO $reset$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM schools WHERE id='${SCHOOL}' AND name=${quote(SCHOOL_NAME)} AND slug='${SLUG}') THEN RAISE EXCEPTION 'Demo school missing'; END IF;
      ${tables.filter(t=>t!=='schools').map(table=>`IF EXISTS (SELECT 1 FROM public.${ident(table)} WHERE school_id='${SCHOOL}' AND id NOT IN (${ids(table)})) THEN RAISE EXCEPTION 'Manual additions in ${table}; reset refused'; END IF;`).join('\n')}
      IF EXISTS (SELECT 1 FROM public.school_documents WHERE school_id='${SCHOOL}') OR EXISTS (SELECT 1 FROM public.teacher_documents WHERE school_id='${SCHOOL}') OR EXISTS (SELECT 1 FROM public.teacher_tasks WHERE school_id='${SCHOOL}') OR EXISTS (SELECT 1 FROM public.teacher_payroll WHERE school_id='${SCHOOL}') OR EXISTS (SELECT 1 FROM public.teacher_performance WHERE school_id='${SCHOOL}') OR EXISTS (SELECT 1 FROM public.teacher_timetable_entries WHERE school_id='${SCHOOL}') OR EXISTS (SELECT 1 FROM public.fee_payments WHERE school_id='${SCHOOL}') OR EXISTS (SELECT 1 FROM public.marks WHERE school_id='${SCHOOL}') OR EXISTS (SELECT 1 FROM public.document_target_classes WHERE document_id IN (SELECT id FROM documents WHERE school_id='${SCHOOL}')) OR EXISTS (SELECT 1 FROM public.document_target_teachers WHERE document_id IN (SELECT id FROM documents WHERE school_id='${SCHOOL}')) THEN RAISE EXCEPTION 'Additional demo data exists; reset refused'; END IF;
    END $reset$;
    DO $dependencies$
    DECLARE f record; predicate text; unsafe boolean;
    BEGIN
      FOR f IN SELECT c.conrelid,c.confrelid,c.conkey,c.confkey,child.relname child_name,parent.relname parent_name
        FROM pg_constraint c JOIN pg_class child ON child.oid=c.conrelid JOIN pg_class parent ON parent.oid=c.confrelid
        WHERE c.contype='f' AND parent.relnamespace='public'::regnamespace AND parent.relname IN (${tables.filter(t=>!['schools','profiles'].includes(t)).map(quote).join(',')})
      LOOP
        SELECT string_agg(format('c.%I=p.%I',ca.attname,pa.attname),' AND ' ORDER BY keys.n) INTO predicate
          FROM unnest(f.conkey,f.confkey) WITH ORDINALITY keys(child_key,parent_key,n)
          JOIN pg_attribute ca ON ca.attrelid=f.conrelid AND ca.attnum=keys.child_key
          JOIN pg_attribute pa ON pa.attrelid=f.confrelid AND pa.attnum=keys.parent_key;
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s c JOIN %s p ON %s WHERE p.school_id=$1 AND (to_jsonb(c)->>''school_id'' IS DISTINCT FROM $1::text OR NOT EXISTS(SELECT 1 FROM demo_owned_ids owned WHERE owned.table_name=$2 AND owned.id::text=to_jsonb(c)->>''id'')))',f.conrelid::regclass,f.confrelid::regclass,predicate) INTO unsafe USING '${SCHOOL}'::uuid,f.child_name;
        IF unsafe THEN RAISE EXCEPTION 'Unexpected dependency in %, reset refused',f.child_name; END IF;
      END LOOP;
    END $dependencies$;
    SELECT set_config('app.publishing_exam','yes',true);
    UPDATE public.exams SET published_at=NULL,published_by=NULL WHERE school_id='${SCHOOL}' AND id IN (${plan.rows.exams.map(r=>quote(r.id)).join(',')});
    DELETE FROM public.direct_messages WHERE school_id='${SCHOOL}';
    DELETE FROM public.scheduled_direct_messages WHERE school_id='${SCHOOL}';
    DELETE FROM public.direct_conversations WHERE school_id='${SCHOOL}';
    DELETE FROM public.exam_marks WHERE school_id='${SCHOOL}';
    DELETE FROM public.exam_subjects WHERE school_id='${SCHOOL}';
    DELETE FROM public.exams WHERE school_id='${SCHOOL}';
    DELETE FROM public.documents WHERE school_id='${SCHOOL}';
    DELETE FROM public.document_categories WHERE school_id='${SCHOOL}';
    DELETE FROM public.admission_applications WHERE school_id='${SCHOOL}';
    DELETE FROM public.account_requests WHERE school_id='${SCHOOL}';
    DELETE FROM public.activity_logs WHERE school_id='${SCHOOL}';
    DELETE FROM public.fee_records WHERE school_id='${SCHOOL}';
    DELETE FROM public.fee_types WHERE school_id='${SCHOOL}';
    DELETE FROM public.attendance WHERE school_id='${SCHOOL}';
    DELETE FROM public.teacher_attendance WHERE school_id='${SCHOOL}';
    DELETE FROM public.teacher_leave_requests WHERE school_id='${SCHOOL}';
    DELETE FROM public.teacher_assignments WHERE school_id='${SCHOOL}';
    DELETE FROM public.school_periods WHERE school_id='${SCHOOL}';
    DELETE FROM public.classes WHERE school_id='${SCHOOL}';
    DELETE FROM public.students WHERE school_id='${SCHOOL}';
    DELETE FROM public.teachers WHERE school_id='${SCHOOL}';
    DELETE FROM public.notices WHERE school_id='${SCHOOL}';
    DELETE FROM public.news_events WHERE school_id='${SCHOOL}';\n`;
  }
  sql+=`DO $auth$ BEGIN
    ${plan.accounts.map(a=>`IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id='${a.id}' AND email=${quote(a.email)} AND raw_app_meta_data->>'demo_seed'='${MARKER}' AND raw_app_meta_data->>'school_id'='${SCHOOL}' AND raw_app_meta_data->>'role'=${quote(a.role)} AND raw_app_meta_data->>'approval_status'=${quote(a.status)}) THEN RAISE EXCEPTION 'Create and verify the fixed demo Auth accounts first'; END IF;`).join('\n')}
  END $auth$;\n`;
  for(const [table,rows] of Object.entries(plan.rows)) {
    const large=largeTableSql(table,plan);if(large){sql+=large;continue;}
    const columns=Object.keys(rows[0]);
    // Never upsert published subjects/marks: their existing triggers reject even
    // no-op updates. DO NOTHING preserves both reruns and later manual edits.
    const order=table==='exam_marks'?' ORDER BY id':'';
    const source=quote(JSON.stringify(rows));
    const published=table==='exam_subjects'?` WHERE NOT EXISTS (SELECT 1 FROM public.exam_subjects e WHERE e.id=x.id)`:table==='exam_marks'?` WHERE NOT EXISTS (SELECT 1 FROM public.exam_marks e WHERE e.id=x.id)`:'';
    sql+=`INSERT INTO public.${ident(table)} (${columns.map(ident).join(',')}) SELECT ${columns.map(c=>`x.${ident(c)}`).join(',')} FROM jsonb_populate_recordset(NULL::public.${ident(table)}, ${source}::jsonb) x${published}${order} ON CONFLICT (id) DO NOTHING;\n`;
  }
  sql+=`SELECT set_config('request.jwt.claims',${quote(JSON.stringify({sub:PRINCIPAL,role:'authenticated',app_metadata:{role:'admin',school_id:SCHOOL,approval_status:'approved'}}))},true);\n`;
  for(const exam of plan.publish) sql+=`SELECT (public.publish_exam('${exam}'::uuid)).id;\n`;
  sql+=`DO $verify$ BEGIN IF (SELECT count(*) FROM public.students WHERE school_id='${SCHOOL}')<180 OR (SELECT count(*) FROM public.teachers WHERE school_id='${SCHOOL}')<20 OR (SELECT count(*) FROM public.exams WHERE school_id='${SCHOOL}' AND published_at IS NOT NULL)<2 THEN RAISE EXCEPTION 'Incomplete demo seed'; END IF;
    IF EXISTS (SELECT * FROM demo_others_before EXCEPT SELECT * FROM (${snapshots}) other_tenants) THEN RAISE EXCEPTION 'Other tenant changed; transaction rolled back'; END IF;
  END $verify$;\nCOMMIT;\n`;
  return sql;
}
