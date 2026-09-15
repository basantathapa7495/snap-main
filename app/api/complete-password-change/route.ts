import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !secretKey) {
    return NextResponse.json(
      { error: "Password change is not configured." },
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
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user || user.app_metadata?.role !== "teacher") {
    return NextResponse.json(
      { error: "A valid teacher session is required." },
      { status: 403 },
    );
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      must_change_password: false,
    },
  });

  if (updateError) {
    return NextResponse.json(
      { error: "Your password was changed, but setup could not be completed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
