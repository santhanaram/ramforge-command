import 'server-only';
import { redirect } from 'next/navigation';
import { demoWritesAllowed, emailAllowed, supabaseConfigured } from '../env';
import { createClient } from '../supabase/server';
import { demoStore } from './demo';
import { supabaseStore } from './supabase';
import type { Store } from './types';

// Returns the store for this request: Supabase for a signed-in user when configured, otherwise the demo store.
export async function getStore(): Promise<Store> {
  if (!supabaseConfigured()) return demoStore(demoWritesAllowed());
  const db = await createClient();
  const { data } = await db.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect('/login');
  const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : null;
  if (!emailAllowed(email)) {
    await db.auth.signOut();
    redirect(`/login?error=${encodeURIComponent('This account is not allowed in this workspace.')}`);
  }
  return supabaseStore(db, claims.sub, email);
}
