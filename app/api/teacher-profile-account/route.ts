import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

async function authorize(request: Request, teacherId: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) return { error: NextResponse.json({ error: "Account service is not configured." }, { status: 500 }) };
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return { error: NextResponse.json({ error: "Session expired." }, { status: 401 }) };
  const { data: principal, error: principalError } = await admin.from("profiles").select("school_id,role").eq("user_id", user.id).maybeSingle();
  if (principalError || !principal?.school_id || !["admin", "principal", "school_admin"].includes(principal.role?.trim().toLowerCase() || "")) {
    return { error: NextResponse.json({ error: "Principal access required." }, { status: 403 }) };
  }
  const { data: teacher, error: teacherError } = await admin.from("teachers").select("id,user_id").eq("id", teacherId).eq("school_id", principal.school_id).maybeSingle();
  if (teacherError || !teacher) return { error: NextResponse.json({ error: "Teacher not found in your school." }, { status: 404 }) };
  return { admin, teacher };
}

export async function GET(request: Request) {
  const teacherId = new URL(request.url).searchParams.get("teacherId");
  if (!teacherId) return NextResponse.json({ error: "Teacher required." }, { status: 400 });
  const context = await authorize(request, teacherId);
  if (context.error) return context.error;
  if (!context.teacher?.user_id) return NextResponse.json({ email: null, lastLogin: null, suspended: false });
  const { data, error } = await context.admin!.auth.admin.getUserById(context.teacher.user_id);
  if (error || !data.user) return NextResponse.json({ error: "Teacher account unavailable." }, { status: 404 });
  return NextResponse.json({ email: data.user.email || null, lastLogin: data.user.last_sign_in_at || null, suspended: Boolean(data.user.banned_until && new Date(data.user.banned_until) > new Date()) });
}

export async function POST(request: Request) {
  let body: { teacherId?: string; action?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body.teacherId || !["suspend", "restore"].includes(body.action || "")) return NextResponse.json({ error: "Invalid account action." }, { status: 400 });
  const context = await authorize(request, body.teacherId);
  if (context.error) return context.error;
  if (!context.teacher?.user_id) return NextResponse.json({ error: "Teacher has no portal account." }, { status: 400 });
  const { data: target, error: lookupError } = await context.admin!.auth.admin.getUserById(context.teacher.user_id);
  if (lookupError || !target.user || target.user.app_metadata?.role !== "teacher") return NextResponse.json({ error: "Teacher account could not be verified." }, { status: 403 });
  const { error } = await context.admin!.auth.admin.updateUserById(context.teacher.user_id, { ban_duration: body.action === "suspend" ? "876000h" : "0s" });
  if (error) return NextResponse.json({ error: "Portal access could not be updated." }, { status: 500 });
  return NextResponse.json({ success: true, suspended: body.action === "suspend" });
}
