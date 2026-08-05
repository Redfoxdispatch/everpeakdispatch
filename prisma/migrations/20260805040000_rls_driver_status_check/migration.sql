-- Fix: is_assigned_driver() (added in 20260805030000_rls_policy_fixes)
-- queries drivers/carrier_assignments directly via d.user_id = auth.uid(),
-- never joining profiles — so it did NOT inherit the status = 'active'
-- check added to current_company_id()/current_role_name() in the same
-- migration. Caught empirically: a driver flipped to 'suspended' still saw
-- their assigned load through this function since it never checked status
-- at all. Fixed by requiring the driver's own profile to be active.
CREATE OR REPLACE FUNCTION public.is_assigned_driver(p_load_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM carrier_assignments ca
    JOIN drivers d ON d.id = ca.driver_id
    JOIN profiles p ON p.id = d.user_id
    WHERE ca.load_id = p_load_id AND d.user_id = auth.uid() AND p.status = 'active' AND ca.status IN ('offered', 'accepted')
  )
$$;
