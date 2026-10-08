-- Legacy RPCs must obey the same tenant policies as direct table reads.
CREATE OR REPLACE FUNCTION public.get_school_stats(school_uuid uuid)
RETURNS TABLE(students bigint, teachers bigint, classes bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT
    (SELECT count(*) FROM public.students WHERE school_id=school_uuid),
    (SELECT count(*) FROM public.teachers WHERE school_id=school_uuid),
    (SELECT count(*) FROM public.classes WHERE school_id=school_uuid);
$$;
CREATE OR REPLACE FUNCTION public.get_school_teachers(school_uuid uuid)
RETURNS TABLE(name text, subject text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT t.name,t.subject FROM public.teachers t WHERE t.school_id=school_uuid;
$$;
