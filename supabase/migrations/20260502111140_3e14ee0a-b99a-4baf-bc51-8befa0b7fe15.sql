-- Helper: can the current user view a given profile based on bid/task relationships?
CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- self
    auth.uid() = _profile_user_id
    -- admin
    OR public.is_admin()
    -- viewer is a client whose task received a bid from _profile_user_id
    OR EXISTS (
      SELECT 1
      FROM public.bids b
      JOIN public.tasks t ON t.id = b.task_id
      WHERE b.freelancer_id = _profile_user_id
        AND t.client_id = auth.uid()
    )
    -- viewer is a freelancer who bid on a task owned by _profile_user_id
    OR EXISTS (
      SELECT 1
      FROM public.bids b
      JOIN public.tasks t ON t.id = b.task_id
      WHERE b.freelancer_id = auth.uid()
        AND t.client_id = _profile_user_id
    )
$$;

-- Replace the public SELECT policy on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles viewable by self, admins, and connected counterparties"
ON public.profiles
FOR SELECT
USING (public.can_view_profile(user_id));

-- Enable leaked password protection (HIBP)
-- Note: this is configured via auth settings in code below if available;
-- otherwise, configure via configure_auth tool.