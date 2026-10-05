import test from "node:test";
import assert from "node:assert/strict";
import { ageOn, attendanceRate, attendanceStatus, belongsToClass, grade } from "../lib/teacher-students.ts";

const cls={id:"c",school_id:"s",class_name:"Class 10",class:null,name:null,class_number:null,section_name:"A",section:"A",academic_year:2083,archived_at:null};
const student={id:"st",name:"Student",class:"Grade 10",section:"a",roll_no:"2",gender:"Female",date_of_birth:"2010-01-12",dob:null,parent_name:null,parent_phone:null,address:null,email:null};
const attendance=[{id:"1",student_id:"st",attendance_date:"2026-10-01",status:"Present"},{id:"2",student_id:"st",attendance_date:"2026-10-02",status:"late"},{id:"3",student_id:"st",attendance_date:"2026-10-03",status:"Absent"}];

test("student URLs remain scoped to exact assigned class and section",()=>{assert.equal(belongsToClass(student,cls),true);assert.equal(belongsToClass({...student,section:"B"},cls),false);assert.equal(belongsToClass({...student,class:"11"},cls),false);});
test("attendance status and percentage use real recorded rows",()=>{assert.equal(attendanceStatus(attendance,"st","2026-10-01"),"present");assert.equal(attendanceStatus(attendance,"st","2026-10-04"),"not marked");assert.equal(attendanceRate(attendance,"st"),67);assert.equal(attendanceRate(attendance,"other"),null);});
test("age and grades handle missing and boundary values",()=>{assert.equal(ageOn("2010-01-12",new Date("2026-01-11T00:00:00Z")),15);assert.equal(ageOn("2010-01-12",new Date("2026-01-12T00:00:00Z")),16);assert.equal(ageOn(null),null);assert.deepEqual([grade(90),grade(80),grade(70),grade(40),grade(39),grade(null)],["A+","A","B+","C","NG","—"]);});
