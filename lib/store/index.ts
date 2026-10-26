import 'server-only';
import { redirect } from 'next/navigation';
import { demoWritesAllowed, supabaseConfigured } from '../env';
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
  return supabaseStore(db, claims.sub, typeof claims.email === 'string' ? claims.email : null);
}
