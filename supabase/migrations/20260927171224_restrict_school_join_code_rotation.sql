-- Join codes can only be rotated by the authenticated principal API, which
-- generates new values server-side. Principals can still toggle joining.
revoke update (teacher_join_code, student_join_code)
  on table public.school_join_settings from authenticated;
