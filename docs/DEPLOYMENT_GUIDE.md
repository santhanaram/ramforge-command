# RAMFORGE Command: beginner setup guide

This guide takes you from the code on GitHub to a private, live app. Do the steps in order. Nothing here needs you to share a key with anyone, including an AI assistant.

## 1. Try it on your computer (optional)

1. Install Node.js 22 from nodejs.org.
2. Download the repository (GitHub, green **Code** button, **Download ZIP**) and unzip it, or use `git clone`.
3. Open a terminal in the folder and run:

```bash
npm install
npm run dev
```

4. Open http://localhost:3000. You are in demo mode: sample data and simulated AI, both labelled at the top of the page.

## 2. Create the Supabase database

1. Go to supabase.com, sign in and create a **new project** just for RAMFORGE. Save the database password somewhere safe.
2. In the project, open **SQL Editor**. Paste the contents of `supabase/migrations/20261026000000_initial.sql` and click **Run**. Then do the same with `supabase/migrations/20261027000000_workforce_core.sql`. Run them in that order, once each.
3. Open **Authentication > Sign In / Providers** and make sure **Email** is enabled.
4. Open **Authentication > URL Configuration**. Set **Site URL** to your app address (for now `http://localhost:3000`) and add `http://localhost:3000/auth/callback` under **Redirect URLs**. You will add the Vercel address in step 4.
5. Open **Project Settings > API Keys** (or **Connect**) and copy the **Project URL** and the **publishable** key. Do not copy the secret or service_role key; this app never needs it.

## 3. Connect your computer to Supabase (optional)

Copy `.env.example` to a new file named `.env.local` and fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
ALLOWED_EMAILS=you@example.com
ALLOW_SIGNUPS=true
```

Restart `npm run dev`. You will be sent to the sign-in page. Enter your email, click the link in the email, and you are in. After your account exists, set `ALLOW_SIGNUPS=` (empty) so nobody else can create one, and in Supabase turn off **Allow new users to sign up** under Authentication settings.

`.env.local` is ignored by git, so it is never uploaded.

## 4. Deploy with Vercel

1. Go to vercel.com and sign in with GitHub.
2. Click **Add New > Project**, choose `santhanaram/ramforge-command`, keep the Next.js preset.
3. Before clicking Deploy, open **Environment Variables** and add the same values as step 3 (URL, publishable key, `ALLOWED_EMAILS`, and `ALLOW_SIGNUPS=true` only until your account exists).
4. Deploy. When it finishes, copy the address (for example `https://ramforge-command.vercel.app`).
5. Back in Supabase **URL Configuration**, set **Site URL** to that address and add `https://YOUR-ADDRESS/auth/callback` to **Redirect URLs**.
6. Open the address, sign in, and create a task. Reload the page: the task should still be there.

## 5. Turn on live AI (optional, costs money)

1. Create an API key at console.anthropic.com and set a monthly spend limit there.
2. In Vercel **Settings > Environment Variables**, add `ANTHROPIC_API_KEY` with the key. Optionally set `AI_DAILY_BUDGET_USD` (default 5). Never put the key in a `NEXT_PUBLIC_` variable or in the code.
3. Redeploy. The top bar changes from "AI: simulated" to "AI: live". Every run then shows its tokens and cost.

## 6. Acceptance checklist

- [ ] Home loads on desktop and phone, and the top bar shows live database and the correct AI mode.
- [ ] Workforce shows 75 roles: 5 heads, 10 leads, 60 specialists, each with 10 responsibilities.
- [ ] A task you create is still there after reload, and is not visible from a second test account.
- [ ] A pending source cannot be given text until its rights are approved with evidence.
- [ ] A task cannot be released before Vera's review passes, and release asks for your rationale.
- [ ] Runs are labelled live or simulated, with tokens and cost.

## Running the tests

```bash
npm run lint && npm test && npm run build && npm run test:e2e
npm run test:db   # needs PostgreSQL 15 or newer installed locally
```

GitHub runs all of these automatically on every push and pull request (see the **Actions** tab).
