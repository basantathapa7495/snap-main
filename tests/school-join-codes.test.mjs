import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateJoinCode, validateSchoolJoiningCodes } from '../lib/server/school-join-codes.ts';

function client(schoolCode, record) {
  return {
    from(table) {
      assert.equal(table, 'school_join_settings');
      return {
        select() {
          return {
            eq(column, value) {
              assert.equal(column, 'school_code');
              return { async maybeSingle() { return { data: value === schoolCode ? record : null, error: null }; } };
            },
          };
        },
      };
    },
  };
}

test('generated codes are six digits and exclude existing codes', () => {
  const existing = generateJoinCode();
  for (let index = 0; index < 100; index++) {
    const code = generateJoinCode([existing]);
    assert.match(code, /^[0-9]{6}$/);
    assert.notEqual(code, existing);
  }
});

test('joining validates the school and matching role code together', async () => {
  const school = generateJoinCode();
  const teacher = generateJoinCode([school]);
  const student = generateJoinCode([school, teacher]);
  const otherSchool = generateJoinCode([school, teacher, student]);
  const admin = client(school, { school_id: 'school-id', teacher_join_code: teacher, student_join_code: student, teacher_join_enabled: true, student_join_enabled: true });
  assert.equal(await validateSchoolJoiningCodes(admin, school, teacher, 'teacher'), 'school-id');
  assert.equal(await validateSchoolJoiningCodes(admin, school, student, 'student'), 'school-id');
  assert.equal(await validateSchoolJoiningCodes(admin, otherSchool, teacher, 'teacher'), null);
  assert.equal(await validateSchoolJoiningCodes(admin, school, teacher, 'student'), null);
  assert.equal(await validateSchoolJoiningCodes(admin, school, student, 'teacher'), null);
  assert.equal(await validateSchoolJoiningCodes(admin, school, 'not digits', 'teacher'), null);
});

test('disabled join roles cannot validate a correct code', async () => {
  const school = generateJoinCode();
  const teacher = generateJoinCode([school]);
  const admin = client(school, { school_id: 'school-id', teacher_join_code: teacher, student_join_code: generateJoinCode([school, teacher]), teacher_join_enabled: false, student_join_enabled: true });
  assert.equal(await validateSchoolJoiningCodes(admin, school, teacher, 'teacher'), null);
});
