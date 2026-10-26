import { LogOut } from 'lucide-react';
import { signOutAction } from '@/app/actions';
import { PageHeader } from '@/components/PageHeader';
import { aiConfig, demoWritesAllowed, supabaseConfigured } from '@/lib/env';
import { getStore } from '@/lib/store';

export default async function SettingsPage() {
  const store = await getStore();
  const ai = aiConfig();
  const live = supabaseConfigured();
  const rows: [string, string, boolean][] = [
    ['Database', live ? 'Supabase connected. Data is stored per account with row-level security.' : `Demo mode. Data is held in server memory and resets on restart${demoWritesAllowed() ? '.' : '. This deployment is read-only.'}`, live],
    ['Sign-in', live ? `Signed in as ${store.userEmail ?? 'unknown'}.` : 'Not available until Supabase is configured.', live],
    ['AI provider', ai.live ? `Live: Anthropic ${ai.model}, effort ${ai.effort}, up to ${ai.maxOutputTokens} output tokens, ${Math.round(ai.timeoutMs / 1000)} s timeout.` : 'Simulated. Add ANTHROPIC_API_KEY in your hosting settings to enable live runs.', ai.live],
    ['Daily AI budget', `$${ai.dailyBudgetUsd.toFixed(2)} per UTC day. Runs that could exceed it are refused before they start.`, true],
  ];
  return (
    <>
      <PageHeader eyebrow="Settings" title="Settings and connections" intro="What is live, what is simulated, and how to change it." />
      <div className="layout2">
        <section className="panel">
          <h2>Status</h2>
          {rows.map(([k, v, ok]) => <div key={k} className="listrow"><span className={`dot ${ok ? 'on' : 'off'}`} aria-hidden /><div><strong>{k}</strong><p className="small">{v}</p></div></div>)}
          {live && <form action={signOutAction}><button className="btn" type="submit"><LogOut size={15} aria-hidden /> Sign out</button></form>}
        </section>
        <section className="panel">
          <h2>Configuration</h2>
          <p className="small">Settings are environment variables, set in Vercel Project Settings (or <code>.env.local</code> on your computer). Keys are never stored in the code or shown in the app.</p>
          <ul className="small duties">
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>: turn on the live database and sign-in.</li>
            <li><code>ALLOWED_EMAILS</code>: comma-separated list of accounts allowed in.</li>
            <li><code>ANTHROPIC_API_KEY</code>: turns on live AI runs (server only).</li>
            <li><code>AI_MODEL</code>, <code>AI_EFFORT</code>, <code>AI_MAX_OUTPUT_TOKENS</code>, <code>AI_TIMEOUT_MS</code>, <code>AI_DAILY_BUDGET_USD</code>: limits for live runs.</li>
          </ul>
          <p className="small">See <code>docs/DEPLOYMENT_GUIDE.md</code> for step-by-step instructions.</p>
        </section>
      </div>
    </>
  );
}
