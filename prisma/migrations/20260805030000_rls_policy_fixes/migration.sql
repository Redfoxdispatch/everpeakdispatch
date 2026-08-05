-- Fixes to the Phase 9 RLS audit (20260805010000_rls_policies_audit),
-- found by an adversarial multi-lens review of that migration before
-- go-live. See context/02-rbac-roles-permissions.md §3 for the exact
-- scoping this corrects against.
--
-- Root cause of every fix below except the status check: a `driver`-role
-- profile shares `company_id` with `carrier_user` profiles at the same
-- carrier company (see prisma/seed-test-users.ts), but the original
-- migration's carrier-side policies only checked company membership, never
-- role. Per the RBAC matrix, `driver` is scoped far narrower than
-- `carrier_user` — no visibility into carrier_rate/settlements/fleet
-- management/documents/messages at all, and only "assigned" (not
-- company-wide) visibility into loads/load_stops/tracking_events.

-- ─────────────────────────────────────────────────────────────
-- Helper functions
-- ─────────────────────────────────────────────────────────────

-- Both re-scoped to require an active profile: `profiles.status` can be
-- `suspended` without that immediately revoking an already-issued Supabase
-- Auth JWT (status is enforced by Next.js middleware on the request path,
-- which this migration's own header notes these RLS policies exist
-- specifically to backstop for the direct-client path that bypasses it).
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid() AND status = 'active'
$$;

CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.name FROM profiles p JOIN roles r ON r.id = p.role_id WHERE p.id = auth.uid() AND p.status = 'active'
$$;

CREATE OR REPLACE FUNCTION public.is_carrier_user()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.current_role_name() = 'carrier_user'
$$;

-- SECURITY DEFINER so this bypasses carrier_assignments' own RLS (driver
-- has NO policy there at all, by design — a plain EXISTS subquery inside
-- another table's policy would otherwise silently see zero rows for a
-- driver even for their own assignment, breaking the driver policies below).
CREATE OR REPLACE FUNCTION public.is_assigned_driver(p_load_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM carrier_assignments ca
    JOIN drivers d ON d.id = ca.driver_id
    WHERE ca.load_id = p_load_id AND d.user_id = auth.uid() AND ca.status IN ('offered', 'accepted')
  )
$$;

-- ─────────────────────────────────────────────────────────────
-- carrier_assignments — driver must get zero rows (buy rate lives here)
-- ─────────────────────────────────────────────────────────────

ALTER POLICY "Carrier reads own carrier_assignments" ON "carrier_assignments"
  USING (carrier_company_id = public.current_company_id() AND public.is_carrier_user());

-- ─────────────────────────────────────────────────────────────
-- Settlements — driver must get zero rows (same rate-visibility rule)
-- ─────────────────────────────────────────────────────────────

ALTER POLICY "Company reads own invoices" ON "invoices"
  USING (company_id = public.current_company_id() AND (type = 'shipper_invoice' OR public.is_carrier_user()));

ALTER POLICY "Company reads own invoice_line_items" ON "invoice_line_items"
  USING (EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = invoice_line_items.invoice_id
    AND i.company_id = public.current_company_id()
    AND (i.type = 'shipper_invoice' OR public.is_carrier_user())
  ));

ALTER POLICY "Company reads own payments" ON "payments"
  USING (EXISTS (
    SELECT 1 FROM invoices i
    WHERE i.id = payments.invoice_id
    AND i.company_id = public.current_company_id()
    AND (i.type = 'shipper_invoice' OR public.is_carrier_user())
  ));

-- ─────────────────────────────────────────────────────────────
-- Fleet management — driver has no entry in the RBAC matrix for these
-- ─────────────────────────────────────────────────────────────

ALTER POLICY "Carrier reads own carrier_profile" ON "carrier_profiles"
  USING (company_id = public.current_company_id() AND public.is_carrier_user());

ALTER POLICY "Carrier reads own drivers" ON "drivers"
  USING (carrier_id = public.current_company_id() AND public.is_carrier_user());

ALTER POLICY "Carrier reads own vehicles" ON "vehicles"
  USING (carrier_id = public.current_company_id() AND public.is_carrier_user());

-- ─────────────────────────────────────────────────────────────
-- Documents / conversations / messages — driver gets "–" (no access) in the
-- matrix for all three; carrier_user additionally loses visibility once an
-- assignment is no longer offered/accepted (declined/fell_off/cancelled
-- carriers shouldn't retain indefinite access to a load's operational PII).
-- ─────────────────────────────────────────────────────────────

ALTER POLICY "Carrier reads carrier-visible documents" ON "documents"
  USING (
    visibility IN ('carrier', 'public') AND public.is_carrier_user() AND (
      (load_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM carrier_assignments ca
        WHERE ca.load_id = documents.load_id AND ca.carrier_company_id = public.current_company_id() AND ca.status IN ('offered', 'accepted')
      ))
      OR owner_company_id = public.current_company_id()
    )
  );

ALTER POLICY "Carrier reads own carrier_broker conversations" ON "conversations"
  USING (
    type = 'carrier_broker' AND load_id IS NOT NULL AND public.is_carrier_user()
    AND EXISTS (
      SELECT 1 FROM carrier_assignments ca
      WHERE ca.load_id = conversations.load_id AND ca.carrier_company_id = public.current_company_id() AND ca.status IN ('offered', 'accepted')
    )
  );

ALTER POLICY "Users read messages in their own conversations" ON "messages"
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (
        (c.type = 'shipper_broker' AND EXISTS (SELECT 1 FROM loads l WHERE l.id = c.load_id AND l.shipper_company_id = public.current_company_id()))
        OR (
          c.type = 'carrier_broker' AND public.is_carrier_user()
          AND EXISTS (
            SELECT 1 FROM carrier_assignments ca
            WHERE ca.load_id = c.load_id AND ca.carrier_company_id = public.current_company_id() AND ca.status IN ('offered', 'accepted')
          )
        )
      )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- loads / load_stops / tracking_events — carrier_user keeps company-wide
-- visibility (gated to offered/accepted, and now role-checked); driver gets
-- a new, narrower "assigned to me" policy instead of sharing carrier_user's.
-- ─────────────────────────────────────────────────────────────

ALTER POLICY "Carrier reads assigned loads" ON "loads"
  USING (
    public.is_carrier_user()
    AND EXISTS (SELECT 1 FROM carrier_assignments ca WHERE ca.load_id = loads.id AND ca.carrier_company_id = public.current_company_id() AND ca.status IN ('offered', 'accepted'))
  );
CREATE POLICY "Driver reads assigned loads" ON "loads" FOR SELECT USING (public.is_assigned_driver(loads.id));

ALTER POLICY "Carrier reads assigned load_stops" ON "load_stops"
  USING (
    public.is_carrier_user()
    AND EXISTS (SELECT 1 FROM carrier_assignments ca WHERE ca.load_id = load_stops.load_id AND ca.carrier_company_id = public.current_company_id() AND ca.status IN ('offered', 'accepted'))
  );
CREATE POLICY "Driver reads assigned load_stops" ON "load_stops" FOR SELECT USING (public.is_assigned_driver(load_stops.load_id));

ALTER POLICY "Carrier reads assigned tracking_events" ON "tracking_events"
  USING (
    public.is_carrier_user()
    AND EXISTS (SELECT 1 FROM carrier_assignments ca WHERE ca.load_id = tracking_events.load_id AND ca.carrier_company_id = public.current_company_id() AND ca.status IN ('offered', 'accepted'))
  );
CREATE POLICY "Driver reads assigned tracking_events" ON "tracking_events" FOR SELECT USING (public.is_assigned_driver(tracking_events.load_id));

-- ─────────────────────────────────────────────────────────────
-- Documentation-only notes on findings deliberately NOT changed here
-- ─────────────────────────────────────────────────────────────

-- audit_logs: the RBAC matrix distinguishes super_admin ("R all") from
-- brokerage_admin ("R non-system actions"), but audit_logs has no column
-- that identifies a "system" action — is_admin_staff() (unchanged) collapses
-- both to the same full-read access. Not fixable without a schema change
-- (e.g. an `is_system_action boolean` column); treat as a known, accepted
-- gap for MVP rather than a defect in this migration.
--
-- profiles/companies: "Internal staff read all profiles/companies" uses
-- is_internal_staff() (includes broker), even though the RBAC matrix's
-- "Users (internal)" and "Company settings" rows give broker "–". Read
-- literally that's over-broad, but broker operationally needs to resolve
-- colleague names (message senders, load creators) and see the brokerage's
-- own company row — capability the app already exposes via Prisma
-- (server-side, bypassing RLS) everywhere broker operates today. Treated as
-- intentional baseline read visibility, not a management/CRUD grant (which
-- remains enforced by lib/permissions/can.ts's assertPermission, untouched
-- by this migration). Left as-is.
--
-- SECURITY DEFINER / no-recursion assumption: confirmed against the live
-- database that the migration role ("postgres") has rolbypassrls = true and
-- owns both `profiles` and `roles` — the helper functions above depend on
-- this. If a future migration ever adds `FORCE ROW LEVEL SECURITY` to
-- `profiles` or `roles`, or migrations start running as a different,
-- lower-privileged role, these functions would need re-verification.
