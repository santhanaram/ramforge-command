import Link from 'next/link';
import { signInAction } from '@/app/actions';
import { Notice } from '@/components/Notice';
import { SubmitButton } from '@/components/SubmitButton';
import { supabaseConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <main className="loginwrap">
      <div className="panel login">
        <div className="brand"><div className="brandicon" aria-hidden>R</div><div><strong>RAMFORGE</strong><small>WORKFORCE COMMAND</small></div></div>
        <h1>Sign in</h1>
        <Notice ok={sp.ok} error={sp.error} />
        {supabaseConfigured() ? (
          <form action={signInAction} className="form">
            <label>Email address<input className="field" type="email" name="email" required autoComplete="email" /></label>
            <SubmitButton pendingText="Sending...">Email me a sign-in link</SubmitButton>
          </form>
        ) : (
          <p>Supabase is not configured, so the app runs in demo mode without sign-in. <Link className="link" href="/">Open the demo</Link>.</p>
        )}
        <p className="small muted">Independent platform. Not affiliated with or endorsed by Alex Hormozi or Acquisition.com.</p>
      </div>
    </main>
  );
}
