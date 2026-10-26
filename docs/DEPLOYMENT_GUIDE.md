# RAMFORGE Command: beginner deployment guide

## 1. Install and preview locally
Install Node.js 22 or a compatible supported Node version, download and unzip the project, open its directory in VS Code, then:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Without credentials the dashboard works in demonstration mode using browser-local task records. Role profiles and all 750 prescribed responsibilities are navigable. Character initials are placeholders; no Pixar-like portraits are bundled.

## 2. Create Supabase
Create a **new**, dedicated project in the Supabase dashboard. In SQL Editor inspect and apply `supabase/migrations/20261026000000_initial.sql`. Configure email authentication and authorized redirect URLs. For local testing add `http://localhost:3000`; for production add your final Vercel URL. Supabase email delivery configuration may need adjustment for real users. Test owner isolation with two accounts before production.

Copy `.env.example` to `.env.local` and fill in the project URL and **publishable** API key:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Never use service_role or secret keys in browser-accessible variables. Restart `npm run dev` and use Settings to sign in via email. The Tasks board uses Supabase for signed-in assignments.

## 3. Publish with GitHub
Create a **private** repository. Run these commands in the project directory:

```bash
git init
git add .
git commit -m "Initial RAMFORGE Command dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

Never commit `.env.local`; it is gitignored. The supplied workflow typechecks and builds after pushes and pull requests.

## 4. Deploy with Vercel
In Vercel, select Add New Project, import the GitHub repository, keep the Next.js framework preset, add the two NEXT_PUBLIC Supabase variables in Vercel Project Settings (not in source files), and deploy. Add your final deployment URL in Supabase authentication redirect settings. Sign in and create a task to verify persistence.

## 5. Acceptance checklist
- Home loads on desktop and mobile.
- Workforce count is 75 with exactly 5 heads, 10 leads, and 60 specialists.
- Role details show 10 responsibilities and correct reporting lines.
- Demo mode explicitly identifies local-only assignments.
- Authenticated tasks appear after reload and do not appear in another user's account.
- Source materials stay unapproved until rights clearance.
- AI execution is not falsely labelled live.

## 6. Known limitations
Dashboard v1 does not include a working agent execution backend, automated transcripts, source file storage, role portraits, live approval event entry, framework retrieval, or billing. These require subsequent implementation. Do not describe the starter as production-ready automation.
