import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceTrendData } from '../lib/attendance-trend.ts';

const today = '2026-09-27';
const students = [{id:'a',class:'A'}, {id:'b',class:'B'}];
const teacherIds = ['t1', 't2', 't3'];
const base = {today, students, teacherIds, studentMarks:[], staffMarks:[], approvedLeaves:[], holidays:[]};
const mark = (student_id, attendance_date, status) => ({student_id,attendance_date,status});
const staff = (teacher_id, attendance_date, status) => ({teacher_id,attendance_date,status});

test('incomplete student classes cannot produce a percentage or a plotted point', () => {
  const result = attendanceTrendData({...base, studentMarks:[mark('a',today,'present')]});
  assert.equal(result.todayStudent.percentage,null);
  assert.equal(result.todayStudent.inProgress,true);
  assert.deepEqual([result.todayStudent.recorded,result.todayStudent.total],[1,2]);
  assert.equal(result.points.length,0);
});
test('complete school attendance uses all enrolled students and includes absences', () => {
  const result = attendanceTrendData({...base, studentMarks:[mark('a',today,'present'),mark('b',today,'absent')]});
  assert.equal(result.todayStudent.percentage,50);
  assert.equal(result.points[0].students,50);
});
test('approved leave is excluded; a corrected absence takes precedence', () => {
  const approvedLeaves = [{teacher_id:'t3',start_date:today,end_date:today}];
  const result = attendanceTrendData({...base, approvedLeaves, staffMarks:[staff('t1',today,'present'),staff('t2',today,'absent')]});
  assert.equal(result.todayStaff.expected,2);
  assert.equal(result.todayStaff.percentage,50);
  const corrected = attendanceTrendData({...base, approvedLeaves, staffMarks:[staff('t1',today,'present'),staff('t2',today,'absent'),staff('t3',today,'absent')]});
  assert.equal(corrected.todayStaff.expected,3);
  assert.equal(corrected.todayStaff.percentage,33.3);
});
test('holiday and unrecorded dates do not appear as zero', () => {
  const day = '2026-09-26';
  const result = attendanceTrendData({...base, holidays:[today], studentMarks:[mark('a',day,'present'),mark('b',day,'present'),mark('a',today,'absent'),mark('b',today,'absent')]});
  assert.deepEqual(result.points.map((point)=>point.date),[day]);
});
test('limits to the latest thirty recorded school days', () => {
  const rows = Array.from({length:36},(_,index)=>{const date=new Date(Date.UTC(2026,8,index+1)).toISOString().slice(0,10);return [mark('a',date,'present'),mark('b',date,'present')]}).flat();
  const result = attendanceTrendData({...base,today:'2026-10-06',studentMarks:rows});
  assert.equal(result.points.length,30);
  assert.equal(result.points.at(-1).date,'2026-10-06');
});
