import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !secretKey || !publishableKey) {
    return NextResponse.json(
      { error: "Teacher password reset is not configured." },
      { status: 500 },
    );
  }

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const authenticated = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  const { teacherId, password } = await request.json();
  if (typeof teacherId !== "string" || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "A teacher and temporary password of at least 8 characters are required." },
      { status: 400 },
    );
  }

  let { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("school_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    const fallback = await authenticated
      .from("profiles")
      .select("school_id, role")
      .eq("user_id", user.id)
      .maybeSingle();
    profile = fallback.data;
    profileError = fallback.error;
  }

  const role = profile?.role?.trim().toLowerCase();
  if (
    profileError ||
    !profile?.school_id ||
    !["admin", "principal", "school_admin"].includes(role || "")
  ) {
    return NextResponse.json(
      { error: "Only a verified principal can reset teacher access." },
      { status: 403 },
    );
  }

  let { data: teacher, error: teacherError } = await admin
    .from("teachers")
    .select("id, user_id")
    .eq("id", teacherId)
    .eq("school_id", profile.school_id)
    .maybeSingle();

  if (teacherError || !teacher) {
    const fallback = await authenticated
      .from("teachers")
      .select("id, user_id")
      .eq("id", teacherId)
      .eq("school_id", profile.school_id)
      .maybeSingle();
    teacher = fallback.data;
    teacherError = fallback.error;
  }

  if (teacherError || !teacher?.user_id) {
    return NextResponse.json(
      { error: "This teacher does not have an active login." },
      { status: 404 },
    );
  }

  const { data: targetUser, error: targetError } =
    await admin.auth.admin.getUserById(teacher.user_id);
  if (targetError || !targetUser.user) {
    return NextResponse.json(
      { error: "The teacher Auth account could not be found." },
      { status: 404 },
    );
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    teacher.user_id,
    {
      password,
      app_metadata: {
        ...targetUser.user.app_metadata,
        role: "teacher",
        school_id: profile.school_id,
        must_change_password: true,
      },
    },
  );

  if (updateError) {
    console.error("Teacher password reset failed", {
      teacherId,
      userId: teacher.user_id,
      message: updateError.message,
    });
    return NextResponse.json(
      { error: "The temporary password could not be reset." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, userId: teacher.user_id });
}
