# RAMFORGE Command

**Independent five-division AI workforce operations platform**

75 hierarchical roles | 5 division heads | 10 team leads | 60 task specialists | 750 prescribed responsibilities.

Built with Next.js, React, TypeScript, Tailwind-free custom responsive CSS, Supabase (optional), GitHub and Vercel. No third-party expert material is bundled. Initial research domain: Alex Hormozi, attribution/rights gated, no claimed endorsement.

## Run

```bash
npm install
npm run dev
```

Visit http://localhost:3000. See `docs/DEPLOYMENT_GUIDE.md` for Supabase/Vercel deployment. `CLAUDE.md` supplies complete Claude Code build instructions.

## Current working features
- Responsive command overview, division directory, 75 individual role cards and a searchable workforce.
- Each role has manager, mission, strengths, skill sets, ten checklist responsibilities.
- Task board with status transitions and create-task capability. Demo mode persists in browser storage.
- Optional Supabase email sign-in, user-owned task records with RLS-backed schema.
- Knowledge and approvals policy overview, GitHub/Vercel/Supabase links.

## Not yet implemented
Actual AI agents, external source intake, storage and framework RAG, expert quotations, generated character artwork, server-side agent scheduling, approval-event UI and production monitoring. The app carefully labels these limitations.

## Security
No private API credentials in frontend. Supabase publishable key is public but protected by RLS. Do not store rights-restricted material before approval. Do not impersonate experts.
