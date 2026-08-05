-- Phase 9 RLS audit — see context/06-development-roadmap.md Phase 9 and
-- context/03-database-schema.md §7. RLS was enabled on every table since
-- Phase 1, but until now only `notifications` had an actual policy — every
-- other table was fail-closed (deny-all) for any query going through the
-- direct Supabase client (Realtime, future client-side reads). Prisma's
-- server actions bypass RLS entirely (service-role connection) and remain
-- the primary authorization layer — see context/04-application-architecture.md
-- §3 — these policies are the defense-in-depth safety net for the direct
-- client path, so they only need to cover SELECT: nothing in this codebase
-- performs a write via the browser/anon Supabase client, so leaving
-- INSERT/UPDATE/DELETE with no policy (== deny, since RLS is already
-- enabled) is the correct, most restrictive posture and is left as-is.
--
-- Rate visibility (context/02-rbac-roles-permissions.md §1 rule 2) is the
-- most sensitive rule these policies enforce: a carrier must never be able
-- to select a row containing sell_rate/margin (quotes, bookings), and a
-- shipper must never be able to select a row containing buy_rate
-- (carrier_assignments) — those two tables deliberately have NO shipper/
-- carrier policy respectively, only internal + the one legitimate side.

-- ─────────────────────────────────────────────────────────────
-- Helper functions
-- ─────────────────────────────────────────────────────────────

-- SECURITY DEFINER so these can read `profiles`/`roles` without recursively
-- re-invoking `profiles`' own RLS policy (the standard Supabase pattern for
-- this — the function runs as its owner, which has BYPASSRLS via the
-- migration role, not as the querying user).
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.name FROM profiles p JOIN roles r ON r.id = p.role_id WHERE p.id = auth.uid()
$$;

-- super_admin, brokerage_admin, broker — the three internal roles; matches
-- lib/permissions/constants.ts ROLE_PERMISSIONS' "loads:read:all" holders.
CREATE OR REPLACE FUNCTION public.is_internal_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.current_role_name() IN ('super_admin', 'brokerage_admin', 'broker')
$$;

-- super_admin, brokerage_admin only — matches the RBAC matrix's
-- "Roles / permissions" and "Audit logs" rows, which exclude broker.
CREATE OR REPLACE FUNCTION public.is_admin_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.current_role_name() IN ('super_admin', 'brokerage_admin')
$$;

-- ─────────────────────────────────────────────────────────────
-- Identity & access
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "Internal staff read all profiles" ON "profiles" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Users read own profile" ON "profiles" FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admin staff read roles" ON "roles" FOR SELECT USING (public.is_admin_staff());
CREATE POLICY "Admin staff read permissions" ON "permissions" FOR SELECT USING (public.is_admin_staff());
CREATE POLICY "Admin staff read role_permissions" ON "role_permissions" FOR SELECT USING (public.is_admin_staff());

-- ─────────────────────────────────────────────────────────────
-- Companies & profiles
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "Internal staff read all companies" ON "companies" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Users read own company" ON "companies" FOR SELECT USING (id = public.current_company_id());

CREATE POLICY "Internal staff read all shipper_profiles" ON "shipper_profiles" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Shipper reads own shipper_profile" ON "shipper_profiles" FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY "Internal staff read all carrier_profiles" ON "carrier_profiles" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Carrier reads own carrier_profile" ON "carrier_profiles" FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY "Internal staff read all drivers" ON "drivers" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Carrier reads own drivers" ON "drivers" FOR SELECT USING (carrier_id = public.current_company_id());

CREATE POLICY "Internal staff read all vehicles" ON "vehicles" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Carrier reads own vehicles" ON "vehicles" FOR SELECT USING (carrier_id = public.current_company_id());

-- Lookup/reference data, no sensitive fields — every portal's forms need to
-- read this for equipment-type dropdowns.
CREATE POLICY "Authenticated users read equipment_types" ON "equipment_types" FOR SELECT USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────
-- Core operational tables
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "Internal staff read all loads" ON "loads" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Shipper reads own loads" ON "loads" FOR SELECT USING (shipper_company_id = public.current_company_id());
CREATE POLICY "Carrier reads assigned loads" ON "loads" FOR SELECT USING (
  EXISTS (SELECT 1 FROM carrier_assignments ca WHERE ca.load_id = loads.id AND ca.carrier_company_id = public.current_company_id())
);

CREATE POLICY "Internal staff read all load_stops" ON "load_stops" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Shipper reads own load_stops" ON "load_stops" FOR SELECT USING (
  EXISTS (SELECT 1 FROM loads l WHERE l.id = load_stops.load_id AND l.shipper_company_id = public.current_company_id())
);
CREATE POLICY "Carrier reads assigned load_stops" ON "load_stops" FOR SELECT USING (
  EXISTS (SELECT 1 FROM carrier_assignments ca WHERE ca.load_id = load_stops.load_id AND ca.carrier_company_id = public.current_company_id())
);

-- quotes carries sell_rate — carrier must NEVER get a policy here (see
-- header note). Only internal staff and the owning shipper.
CREATE POLICY "Internal staff read all quotes" ON "quotes" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Shipper reads own quotes" ON "quotes" FOR SELECT USING (
  EXISTS (SELECT 1 FROM loads l WHERE l.id = quotes.load_id AND l.shipper_company_id = public.current_company_id())
);

-- bookings carries confirmed_rate (locked sell rate) — same rule as quotes.
CREATE POLICY "Internal staff read all bookings" ON "bookings" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Shipper reads own bookings" ON "bookings" FOR SELECT USING (
  EXISTS (SELECT 1 FROM loads l WHERE l.id = bookings.load_id AND l.shipper_company_id = public.current_company_id())
);

-- carrier_assignments carries carrier_rate (buy rate) — shipper must NEVER
-- get a policy here. Only internal staff and the assigned carrier.
CREATE POLICY "Internal staff read all carrier_assignments" ON "carrier_assignments" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Carrier reads own carrier_assignments" ON "carrier_assignments" FOR SELECT USING (carrier_company_id = public.current_company_id());

-- ─────────────────────────────────────────────────────────────
-- Documents, invoicing, payments
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "Internal staff read all documents" ON "documents" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Shipper reads shipper-visible documents" ON "documents" FOR SELECT USING (
  visibility IN ('shipper', 'public') AND (
    (load_id IS NOT NULL AND EXISTS (SELECT 1 FROM loads l WHERE l.id = documents.load_id AND l.shipper_company_id = public.current_company_id()))
    OR owner_company_id = public.current_company_id()
  )
);
CREATE POLICY "Carrier reads carrier-visible documents" ON "documents" FOR SELECT USING (
  visibility IN ('carrier', 'public') AND (
    (load_id IS NOT NULL AND EXISTS (SELECT 1 FROM carrier_assignments ca WHERE ca.load_id = documents.load_id AND ca.carrier_company_id = public.current_company_id()))
    OR owner_company_id = public.current_company_id()
  )
);

CREATE POLICY "Internal staff read all invoices" ON "invoices" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Company reads own invoices" ON "invoices" FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY "Internal staff read all invoice_line_items" ON "invoice_line_items" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Company reads own invoice_line_items" ON "invoice_line_items" FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_line_items.invoice_id AND i.company_id = public.current_company_id())
);

CREATE POLICY "Internal staff read all payments" ON "payments" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Company reads own payments" ON "payments" FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices i WHERE i.id = payments.invoice_id AND i.company_id = public.current_company_id())
);

-- ─────────────────────────────────────────────────────────────
-- Tracking, comms, audit
-- ─────────────────────────────────────────────────────────────

CREATE POLICY "Internal staff read all tracking_events" ON "tracking_events" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Shipper reads own tracking_events" ON "tracking_events" FOR SELECT USING (
  EXISTS (SELECT 1 FROM loads l WHERE l.id = tracking_events.load_id AND l.shipper_company_id = public.current_company_id())
);
CREATE POLICY "Carrier reads assigned tracking_events" ON "tracking_events" FOR SELECT USING (
  EXISTS (SELECT 1 FROM carrier_assignments ca WHERE ca.load_id = tracking_events.load_id AND ca.carrier_company_id = public.current_company_id())
);

CREATE POLICY "Internal staff read all conversations" ON "conversations" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Shipper reads own shipper_broker conversations" ON "conversations" FOR SELECT USING (
  type = 'shipper_broker' AND load_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM loads l WHERE l.id = conversations.load_id AND l.shipper_company_id = public.current_company_id())
);
CREATE POLICY "Carrier reads own carrier_broker conversations" ON "conversations" FOR SELECT USING (
  type = 'carrier_broker' AND load_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM carrier_assignments ca WHERE ca.load_id = conversations.load_id AND ca.carrier_company_id = public.current_company_id())
);

CREATE POLICY "Internal staff read all messages" ON "messages" FOR SELECT USING (public.is_internal_staff());
CREATE POLICY "Users read messages in their own conversations" ON "messages" FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      (c.type = 'shipper_broker' AND EXISTS (SELECT 1 FROM loads l WHERE l.id = c.load_id AND l.shipper_company_id = public.current_company_id()))
      OR (c.type = 'carrier_broker' AND EXISTS (SELECT 1 FROM carrier_assignments ca WHERE ca.load_id = c.load_id AND ca.carrier_company_id = public.current_company_id()))
    )
  )
);

-- notifications already has a policy from the Phase 7 migration
-- (20260805000000_enable_realtime_notifications) — not touched here.

-- audit_logs: admin-tier only (super_admin, brokerage_admin) per the RBAC
-- matrix — broker explicitly gets "–" for this resource, unlike every other
-- internal-staff table above, hence is_admin_staff() not is_internal_staff().
CREATE POLICY "Admin staff read audit_logs" ON "audit_logs" FOR SELECT USING (public.is_admin_staff());
