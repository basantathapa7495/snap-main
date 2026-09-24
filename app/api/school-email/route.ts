import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const tenMinutes = 10 * 60 * 1000;
const hour = 60 * 60 * 1000;
const reply = (error: string, status: number) => NextResponse.json({ error }, { status });

function clean(value: unknown, limit = 160) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function originAllowed(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  try {
    const source = new URL(origin);
    return !!host && source.host === host &&
      (source.protocol === 'https:' || source.hostname === 'localhost' && source.protocol === 'http:');
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!originAllowed(request)) return reply('Invalid request origin.', 403);
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  // This route needs a service-role key to access the private challenge table and Auth Admin API.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const sender = process.env.RESEND_FROM_EMAIL;
  if (!url || !key || !resendKey || !sender) return reply('Email verification is not configured yet.', 503);
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return reply('Invalid request.', 400); }
  const email = clean(body.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply('Enter a valid email address.', 400);
  const now = new Date();

  if (body.action === 'send') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const ipHash = createHmac('sha256', key).update(ip).digest('hex');
    const since = new Date(now.getTime() - hour).toISOString();
    const [emailRequests, ipRequests] = await Promise.all([
      admin.from('school_email_challenges').select('issued_at').eq('email', email).gte('issued_at', since).order('issued_at', { ascending: false }).limit(3),
      admin.from('school_email_challenges').select('id', { count: 'exact', head: true }).eq('request_ip_hash', ipHash).gte('issued_at', since),
    ]);
    if (emailRequests.error || ipRequests.error) return reply('Could not start verification. Please try again.', 500);
    if ((emailRequests.data?.length || 0) >= 3 || (ipRequests.count || 0) >= 10) return reply('Too many codes requested. Try again in an hour.', 429);
    const last = emailRequests.data?.[0]?.issued_at;
    if (last && now.getTime() - new Date(last).getTime() < 60_000) return reply('Please wait one minute before requesting another code.', 429);

    const id = randomUUID();
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const codeHash = createHmac('sha256', key).update(`${id}:${code}`).digest('hex');
    const { error: insertError } = await admin.from('school_email_challenges').insert({
      id, email, code_hash: codeHash, request_ip_hash: ipHash,
      expires_at: new Date(now.getTime() + tenMinutes).toISOString(),
    });
    if (insertError) return reply('Could not start verification. Please try again.', 500);

    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': id },
      body: JSON.stringify({
        from: sender, to: [email], subject: 'Your NEPSOM school verification code',
        text: `Your NEPSOM school registration code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#0f172a"><p style="color:#2563eb;font-weight:700;letter-spacing:.1em">NEPSOM</p><h1 style="font-size:26px">Confirm your school email</h1><p>Enter this code to finish registering your school:</p><p style="font-size:34px;letter-spacing:8px;font-weight:700;background:#eff6ff;padding:20px;border-radius:12px;text-align:center">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`,
      }),
    }).catch(() => null);
    if (!sent?.ok) {
      await admin.from('school_email_challenges').delete().eq('id', id);
      console.error('Resend school verification delivery failed', { status: sent?.status });
      return reply('Could not send the code. Check the email service configuration or try again.', 503);
    }
    return NextResponse.json({ challengeId: id, cooldownSeconds: 60 });
  }

  if (body.action !== 'verify') return reply('Invalid action.', 400);
  const id = clean(body.challengeId, 40);
  const code = clean(body.code, 6);
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^\d{6}$/.test(code)) return reply('Enter the six-digit code from your email.', 400);
  const { data: challenge, error: readError } = await admin.from('school_email_challenges')
    .select('email,code_hash,expires_at,attempts,consumed_at').eq('id', id).maybeSingle();
  if (readError) return reply('Could not verify your code. Please try again.', 500);
  if (!challenge || challenge.email !== email || challenge.consumed_at || new Date(challenge.expires_at) <= now || challenge.attempts >= 5)
    return reply('This code has expired. Request a new one.', 400);
  const actual = createHmac('sha256', key).update(`${id}:${code}`).digest();
  const expected = Buffer.from(challenge.code_hash, 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    await admin.from('school_email_challenges').update({ attempts: challenge.attempts + 1 }).eq('id', id).eq('attempts', challenge.attempts).is('consumed_at', null);
    return reply('Incorrect code. Please check your email and try again.', 400);
  }

  const password = typeof body.password === 'string' ? body.password : '';
  const fullName = clean(body.fullName);
  const school = body.school;
  if (password.length < 8 || password.length > 72 || !fullName || !school || typeof school !== 'object' || Array.isArray(school))
    return reply('Check your registration details and use a password of at least 8 characters.', 400);
  const details = school as Record<string, unknown>;
  const name = clean(details.name);
  const pendingSchool = {
    name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    province: clean(details.province), district: clean(details.district), municipality: clean(details.municipality),
    ward: clean(details.ward, 10), school_type: clean(details.school_type, 32), school_level: clean(details.school_level, 32),
    phone: clean(details.phone, 32), principal: fullName, school_email: clean(details.school_email, 254) || null,
    pan_number: clean(details.pan_number, 32) || null,
  };
  if (!name || !pendingSchool.slug || !pendingSchool.province || !pendingSchool.district || !pendingSchool.municipality || !pendingSchool.ward || !pendingSchool.phone ||
      !['Community', 'Private', 'Religious'].includes(pendingSchool.school_type) ||
      !['Primary', 'Basic', 'Secondary', 'Higher Secondary'].includes(pendingSchool.school_level))
    return reply('Complete all required school details.', 400);

  // Claim the challenge once; competing verification requests cannot create two users.
  const { data: claimed, error: claimError } = await admin.from('school_email_challenges')
    .update({ consumed_at: now.toISOString() }).eq('id', id).eq('code_hash', challenge.code_hash)
    .is('consumed_at', null).lt('attempts', 5).gt('expires_at', now.toISOString()).select('id');
  if (claimError || !claimed?.length) return reply('This code has already been used. Request another one.', 400);

  const { error: createError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: fullName, pending_school: pendingSchool },
  });
  if (createError) {
    console.error('Verified school account creation failed', { message: createError.message });
    return reply(createError.message.toLowerCase().includes('already') ? 'An account with this email already exists. Please sign in.' : 'Could not create your account. Please contact support.', 400);
  }
  return NextResponse.json({ verified: true });
}
