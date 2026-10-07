import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../lib/teacher-timetable.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const mod=await import(`data:text/javascript,${encodeURIComponent(js)}`);

test('time formatting and date movement',()=>{
  assert.equal(mod.formatTime('08:05:00'),'8:05 AM');
  assert.equal(mod.formatTime('13:30:00'),'1:30 PM');
  assert.equal(mod.addDays('2026-10-07',1),'2026-10-08');
});
test('status uses Kathmandu school time',()=>{
  const now=new Date('2026-10-07T04:20:00.000Z'); // 10:05 in Kathmandu
  assert.equal(mod.statusFor('2026-10-07','09:30','10:15',now),'Now');
  assert.equal(mod.statusFor('2026-10-07','08:00','08:45',now),'Completed');
  assert.equal(mod.statusFor('2026-10-07','10:30','11:15',now),'Upcoming');
});
test('week begins Sunday so configured weekdays remain authoritative',()=>{
  assert.equal(mod.weekStart('2026-10-07'),'2026-10-04');
});
