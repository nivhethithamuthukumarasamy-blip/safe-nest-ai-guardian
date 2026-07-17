
DROP POLICY IF EXISTS "Profiles readable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
