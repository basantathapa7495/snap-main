import { randomInt, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export type JoinRole = 'teacher' | 'student';
const codePattern = /^[0-9]{6}$/;

export function generateJoinCode(excluded: readonly string[] = []): string {
  for (let attempt = 0; attempt < 100; attempt++) {
    const code = String(randomInt(100000, 1000000));
    if (!excluded.includes(code)) return code;
  }
  throw new Error('Could not generate an available join code.');
}

// Server-only: pass a trusted service-role client. The caller must separately
// rate-limit any public endpoint that invokes this function.
export async function validateSchoolJoiningCodes(
  admin: SupabaseClient,
  schoolCode: string,
  joinCode: string,
  role: JoinRole,
): Promise<string | null> {
  if (!codePattern.test(schoolCode) || !codePattern.test(joinCode) || !['teacher', 'student'].includes(role)) return null;

  const { data, error } = await admin.from('school_join_settings')
    .select('school_id,teacher_join_code,student_join_code,teacher_join_enabled,student_join_enabled')
    .eq('school_code', schoolCode).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const enabled = role === 'teacher' ? data.teacher_join_enabled : data.student_join_enabled;
  const expected = role === 'teacher' ? data.teacher_join_code : data.student_join_code;
  if (!enabled || !codePattern.test(expected)) return null;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(joinCode)) ? data.school_id : null;
}
