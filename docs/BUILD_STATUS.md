# Build status

Last updated 2026-10-26. Only results that were actually run are listed as verified.

## Verified in a clean Linux environment (Node 22)

- `npm install` and `npm audit`: 0 known vulnerabilities after upgrading Next.js 16.0.1 to 16.4.3.
- `npm run lint` (TypeScript): passes.
- `npm test`: 25 of 25 unit tests pass.
- `npm run test:db`: 31 of 31 database security checks pass on a throwaway PostgreSQL 16 with a local stand-in for Supabase's `auth` schema. Covers two-user isolation, anonymous access, the rights gate, append-only logs and approvals, Vera independence and the RAM release gate.
- `npm run build`: passes.
- `npm run test:e2e`: 12 of 12 browser tests pass (6 journeys on desktop and phone sizes) in demo mode with simulated AI.

## Not yet verified

- The migrations have **not** been applied to a real Supabase project. Supabase's own `auth.uid()` and grants are mimicked locally, not identical.
- Email magic-link sign-in has not been tested end to end (needs a real Supabase project and email delivery).
- Live AI runs have not been executed: no API key was used. The live provider code type-checks against the Anthropic SDK but has not made a real call.
- No deployment to Vercel has been made.
- All 75 roles have an AI-generated photorealistic portrait of a fictional person (Higgsfield, gpt_image_2_5), listed in `data/portraits.ts` with alt text, credit and appearance notes. Images load from the Higgsfield CDN, so they depend on that CDN staying available. The initials placeholder remains as a fallback for any role without an entry.
- Every role page lists five public YouTube videos for its subject area (`data/videos.ts`, 375 links, no repeats), found by web search on 2026-10-26. They are learning links only; inclusion is not endorsement. Links can go stale and should be rechecked.
- No formal accessibility audit (WCAG) has been done beyond semantic markup, labels, focus styles and a phone-width layout check.

## Known limitations

- Demo mode stores data in server memory. On Vercel it can reset at any time and is read-only unless `ALLOW_PUBLIC_DEMO=true`.
- Agent runs execute inside the request (up to 300 seconds). A background queue would be needed for long or batch work.
- Retrieval is keyword based (BM25). Semantic search can be added once there is enough approved material to justify it.
- Vera's automated review is deterministic (citations, exact quotes, uncited claims, impersonation wording, credentials). It does not judge whether reasoning is sound; RAM must still read the output.
