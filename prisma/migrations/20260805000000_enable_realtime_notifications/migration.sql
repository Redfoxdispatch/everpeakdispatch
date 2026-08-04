-- Enables Supabase Realtime (Postgres Changes) on the notifications table,
-- so the in-app notification bell can subscribe to inserts for the
-- authenticated user's own rows via the Supabase client (not Prisma, which
-- has no subscription mechanism — see context/04-application-architecture.md
-- §3 and §6).
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- RLS is enabled on every table (init migration) but no policies were ever
-- written — every table has been fail-closed (deny-all) until now, which
-- was fine because Prisma bypasses RLS and nothing used a direct
-- Supabase-client query. Realtime subscriptions DO go through the
-- authenticated Supabase session and are genuinely governed by RLS, so
-- without this policy the bell's subscription would receive nothing.
CREATE POLICY "Users can read their own notifications"
  ON "notifications"
  FOR SELECT
  USING (auth.uid() = "user_id");
