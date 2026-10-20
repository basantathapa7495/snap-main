"use client";

import { supabase } from "@/lib/supabase";
import { teacherAvatarCache } from "./teacher-avatars";

type Job = { teacherId: string; path: string };
const running = new Map<string, Promise<boolean>>();
const keyFor = (scope: string) => `nepsom:teacher-avatar-cleanup:v1:${scope}`;
function jobs(scope: string): Job[] {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(keyFor(scope)) || "[]");
    return Array.isArray(value) ? value.filter((job) => typeof job?.teacherId === "string" && typeof job?.path === "string").slice(-50) : [];
  } catch { return []; }
}
function remember(scope: string, job: Job, remove = false) {
  try {
    const remaining = jobs(scope).filter((item) => item.path !== job.path);
    sessionStorage.setItem(keyFor(scope), JSON.stringify(remove ? remaining : [...remaining, job].slice(-50)));
  } catch { /* Cleanup still runs when session storage is blocked. */ }
}

// Retry only known superseded paths; never recursively delete a directory.
export function cleanupTeacherAvatar(scope: string, job: Job): Promise<boolean> {
  const [userId, schoolId] = scope.split(":");
  if (!userId || !schoolId || !job.path || job.path.includes("..")) return Promise.resolve(false);
  const key = `${scope}:${job.path}`;
  const existing = running.get(key);
  if (existing) return existing;
  remember(scope, job);
  const task = (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id !== userId) return false;
      const { data: teacher, error } = await supabase.from("teachers").select("id,avatar_path,user_id")
        .eq("id", job.teacherId).eq("school_id", schoolId).maybeSingle();
      if (error || !teacher) continue;
      // Never remove a path that is still the active avatar after a failed save.
      if (teacher.avatar_path === job.path) { remember(scope, job, true); return false; }
      if (teacher.user_id) {
        const linked = await supabase.from("profiles").select("avatar_path").eq("user_id", teacher.user_id).eq("school_id", schoolId).maybeSingle();
        if (linked.error) continue;
        if (linked.data?.avatar_path === job.path) { remember(scope, job, true); return false; }
      }
      const removed = await supabase.storage.from("teacher-avatars").remove([job.path]);
      if (!removed.error) {
        teacherAvatarCache.invalidate(job.path);
        remember(scope, job, true);
        return true;
      }
    }
    console.warn("Previous teacher photo cleanup is pending; it will retry on the next Teachers visit.");
    return false;
  })().catch(() => false).finally(() => running.delete(key));
  running.set(key, task);
  return task;
}

export function resumeTeacherAvatarCleanup(scope: string) {
  // Process sequentially to avoid adding connection pressure during a Storage outage.
  void (async () => { for (const job of jobs(scope)) await cleanupTeacherAvatar(scope, job); })();
}
