-- Moves the app/api/cron/* schedule off Vercel Cron (which hard-rejects a
-- deployment if vercel.json declares a cron more frequent than once/day on
-- the Hobby plan) and onto Supabase's own pg_cron, which has no such limit
-- on any plan tier. The route handlers themselves (app/api/cron/*) are
-- unchanged — only who calls them on a schedule changes; pg_net makes the
-- HTTP call, same CRON_SECRET bearer-token auth as before.
--
-- No secret values live in this file (it's committed to git) — the actual
-- CRON_SECRET is stored in Supabase Vault by scripts/setup-cron-vault-secret.mts
-- (reads from the local environment, never hardcoded), and the cron.schedule
-- jobs below reference it by name via vault.decrypted_secrets, not by value.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net;
