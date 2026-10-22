"use client";

import { createTeacherAvatarCache } from "@/lib/teacher-avatar-cache";
import { supabase } from "@/lib/supabase";

const origin = process.env.NEXT_PUBLIC_TEACHER_IMAGE_ORIGIN || "https://images.nepsom.xyz";

async function authorization() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) throw new Error("Sign in again to manage profile photos.");
  return { Authorization: `Bearer ${session.access_token}` };
}

async function imageRequest(path: string, method: "PUT" | "DELETE", file?: File) {
  let response: Response;
  try {
    response = await fetch(`${origin}/object/${path}`, {
      method,
      headers: { ...await authorization(), ...(file ? { "Content-Type": "image/webp" } : {}) },
      body: file,
    });
  } catch {
    throw new Error("Photo service could not be reached. Check your connection and try again.");
  }
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error || `Photo service returned ${response.status}.`);
  }
}

export async function uploadTeacherAvatar(path: string, photo: File) {
  await imageRequest(path, "PUT", photo);
}

export async function removeTeacherAvatar(path: string) {
  await imageRequest(path, "DELETE");
  avatarCache.invalidate(path);
}

const avatarCache = createTeacherAvatarCache({
  sign: async (paths, signal) => {
    const response = await fetch(`${origin}/sign`, {
      method: "POST",
      headers: { ...await authorization(), "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
      signal,
    });
    if (!response.ok) throw new Error(`Could not load teacher photos (${response.status}).`);
    const result: { urls: { path: string; signedUrl: string }[] } = await response.json();
    return result.urls;
  },
  storage: () => typeof sessionStorage === "undefined" ? null : sessionStorage,
  validUrl: (value) => {
    try { return new URL(value).origin === origin && new URL(value).pathname.startsWith("/photo/"); }
    catch { return false; }
  },
});

export function activateTeacherAvatarCache(userId: string, schoolId: string) {
  const scope = `${userId}:${schoolId}`;
  avatarCache.activate(scope);
  return scope;
}

export function teacherAvatarUrl(scope: string, path?: string | null) {
  return path ? avatarCache.get(scope, path) : Promise.resolve(null);
}

export function invalidateTeacherAvatar(path: string) {
  avatarCache.invalidate(path);
}

export function refreshTeacherAvatarIn(scope: string, path: string) {
  return avatarCache.refreshIn(scope, path);
}
