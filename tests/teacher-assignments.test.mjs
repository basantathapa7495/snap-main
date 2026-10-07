import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../lib/teacher-assignments.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const mod=await import(`data:text/javascript,${encodeURIComponent(js)}`);
test('validates attachment type and size',()=>{
 assert.equal(mod.validateAssignmentFile({type:'application/pdf',size:1024}),'');
 assert.match(mod.validateAssignmentFile({type:'application/x-msdownload',size:100}),/PDF/);
 assert.match(mod.validateAssignmentFile({type:'image/png',size:11*1024*1024}),/10 MB/);
});
test('derives deadline statuses from real counts and dates',()=>{
 const now=new Date('2026-10-07T04:00:00Z');
 assert.equal(mod.assignmentStatus({status:'active',due_at:'2026-10-10T04:00:00Z'},0,2,now),'Active');
 assert.equal(mod.assignmentStatus({status:'active',due_at:'2026-10-08T04:00:00Z'},0,2,now),'Pending');
 assert.equal(mod.assignmentStatus({status:'active',due_at:'2026-10-06T04:00:00Z'},0,2,now),'Overdue');
 assert.equal(mod.assignmentStatus({status:'active',due_at:'2026-10-10T04:00:00Z'},2,2,now),'Completed');
});
