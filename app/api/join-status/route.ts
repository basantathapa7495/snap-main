import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!url || !key || !token) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { data: requestRecord } = await admin.from('account_requests').select('status,requested_role').eq('auth_user_id', user.id).maybeSingle();
  if (!requestRecord) return NextResponse.json({ status: 'none' }, { headers: { 'Cache-Control': 'no-store' } });
  const { data: profile } = requestRecord.status === 'approved' ? await admin.from('profiles').select('role').eq('user_id', user.id).maybeSingle() : { data: null };
  return NextResponse.json({ status: profile?.role === requestRecord.requested_role ? 'approved' : requestRecord.status === 'approved' ? 'pending' : requestRecord.status, role: requestRecord.requested_role }, { headers: { 'Cache-Control': 'no-store' } });
}
