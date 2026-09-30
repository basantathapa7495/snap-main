import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlan,SCHOOL,accounts} from '../scripts/demo/plan.mjs';
import {seedSql} from '../scripts/demo/sql.mjs';
const p=createPlan('2026-09-30');
test('demo relationships, time bounds and timetable conflicts are consistent',()=>{
  assert.equal(p.rows.students.length,180);assert.equal(p.rows.teachers.length,20);
  const students=new Map(p.rows.students.map(s=>[s.id,s])),teachers=new Map(p.rows.teachers.map(t=>[t.id,t]));
  for(const [table,rows] of Object.entries(p.rows)){
    assert.equal(new Set(rows.map(r=>r.id)).size,rows.length,`${table}: unique IDs`);
    for(const r of rows)assert.equal(table==='schools'?r.id:r.school_id,SCHOOL,`${table}: tenant scope`);
  }
  for(const a of p.rows.attendance){const s=students.get(a.student_id);assert(s);assert.equal(s.class,a.class_name);assert.equal(s.section,a.section);assert(a.attendance_date<=p.anchor);}
  for(const a of p.rows.teacher_attendance){const t=teachers.get(a.teacher_id);assert(t);assert(!t.left_at||a.attendance_date<t.left_at);}
  const slots=new Set();for(const a of p.rows.teacher_assignments){const classSlot=`class:${a.class_id}:${a.period_id}`,teacherSlot=`teacher:${a.teacher_id}:${a.period_id}`;assert(!slots.has(classSlot));slots.add(classSlot);if(a.teacher_id){assert(teachers.has(a.teacher_id));assert(!slots.has(teacherSlot));slots.add(teacherSlot);}}
  const subjects=new Map(p.rows.exam_subjects.map(s=>[s.id,s]));for(const mark of p.rows.exam_marks){const sub=subjects.get(mark.subject_id),student=students.get(mark.student_id);assert(sub&&student);assert.equal(sub.class_name,student.class);assert.equal(sub.section,student.section);assert(mark.marks>=0&&mark.marks<=sub.full_marks);}
  for(const pay of p.rows.fee_records){assert(students.has(pay.student_id));assert(pay.payment_date<=p.anchor);assert(pay.amount>0);}
  assert(accounts.every(a=>a.email.endsWith('@sunrise-demo.example.com')));
});
test('seeding is reproducible and generated reset fails closed',()=>{
  assert.deepEqual(createPlan('2026-09-30'),p);
  const seed=seedSql(p),reset=seedSql(p,true);
  assert(seed.includes('ON CONFLICT (id) DO NOTHING'));
  assert(reset.includes('Manual additions'));
  assert(reset.includes('Unexpected dependency'));
  assert(reset.includes('Other tenant changed; transaction rolled back'));
  assert(!reset.includes('DELETE FROM public.schools'));
  assert(!seed.includes('DISABLE ROW LEVEL SECURITY'));
});
