import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Completes the magic-link sign-in. Supports both the PKCE "code" link and the "token_hash" email template.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const db = await createClient();
  const { error } = code
    ? await db.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await db.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error('Missing sign-in code') };
  const target = new URL(error ? `/login?error=${encodeURIComponent('That sign-in link is invalid or has expired.')}` : '/', url.origin);
  return NextResponse.redirect(target);
}
