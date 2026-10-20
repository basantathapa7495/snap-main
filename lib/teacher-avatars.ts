"use client";

const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`;

export function teacherAvatarUrl(path?: string | null) {
  if (!path) return "";
  const safePath = path.split("/").map(encodeURIComponent).join("/");
  return `${storageUrl}/object/public/teacher-avatars/${safePath}`;
}

export function activateTeacherAvatarCache(userId: string, schoolId: string) {
  return `${userId}:${schoolId}`;
}
