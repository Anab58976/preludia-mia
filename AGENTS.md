
- `@vercel/oidc` is aliased to `src/lib/shims/vercel-oidc.ts` in vite.config.ts: the real package loads Node file APIs that crash the published Worker (every page 500).
