// Preloaded via NODE_OPTIONS="--require ./scripts/dns-fix.cjs".
// Works around a local router DNS proxy that fails to resolve Supabase's
// pooler hostname (a multi-level CNAME chain to an AWS load balancer).
// Scoped to whichever Node process loads it — no system-wide DNS change.
require("dns").setServers(["1.1.1.1", "8.8.8.8"]);
