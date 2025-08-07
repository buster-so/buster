Memory profiling and optimization guide for @buster-app/web

Scope
- Next.js 14 app in apps/web
- Goal: keep initial memory under 500 MB in dev (next dev) and prod (next start)

Profiling steps
1) Dev mode heap snapshots
- From apps/web:
  - Node >= 22 required
  - Start: NODE_OPTIONS="--inspect" pnpm dev
  - In Chrome: open chrome://inspect, attach to Node target
  - Take Heap Snapshot shortly after boot
  - Sit idle on landing page ~20s, take second snapshot
- Optional RSS sampling:
  - ps -o pid,rss,command -p "$(pgrep -f 'next dev')"

2) Prod mode heap snapshots
- Build: pnpm build
- Start: NODE_OPTIONS="--inspect" pnpm start
- Repeat snapshots and RSS steps above

3) Bundle analyzer
- ANALYZE=true pnpm build
- Open the generated analyzer report to inspect large bundles and shared chunks

Guardrails and configuration
- Route prefetching can be gated via env:
  - NEXT_PUBLIC_ENABLE_PREFETCH=true to enable route/data prefetch
  - Default behavior without this env is to skip global prefetching to reduce startup memory
- React Query persistence and GC:
  - Persistence maxAge default reduced to 1 day
  - GC time reduced to 6 hours
  - Only an explicit allowlist of queries is persisted; lists are not persisted by default
- Heavy libraries:
  - Shiki syntax highlighter is initialized on demand instead of on module load
  - Prefer dynamic import and ssr:false for heavy UI modules (charts, editors) where possible

Best practices to avoid regressions
- Use dynamic imports for heavy components and code-split large feature kits
- Keep React Query dehydrate allowlist minimal; avoid persisting large result sets unless necessary
- Avoid initializing wasm or large workers at module import time; initialize on first use or on idle
- Prefer requestIdleCallback or visibility-based loading for non-critical assets

Troubleshooting tips
- If memory is unexpectedly high, check:
  - Heap snapshot top retainers for large arrays/maps (caches)
  - Whether prefetch env flag is unintentionally enabled
  - Analyzer for heavy modules bundled into the main client chunk
- Validate that server-only modules are not imported in client code paths

Contact
- Open an issue or PR with heap snapshot screenshots and analyzer diffs when proposing changes.
