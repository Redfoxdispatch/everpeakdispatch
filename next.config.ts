import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Forces single-worker static generation. On this filesystem, next
    // build's parallel worker pool has repeatedly failed with a *different*
    // random page each time ("Cannot find module .../page.js") — a worker
    // process reading a compiled page file before the main process has
    // finished flushing it to disk. Single-worker generation removes the
    // race entirely at the cost of build speed.
    cpus: 1,
  },
};

export default nextConfig;
