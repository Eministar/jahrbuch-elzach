import { NextResponse } from 'next/server';
import { getAuthState } from '@/lib/auth';
import { clearSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getAuthState();
    if (!state.session) {
      // no cookie / not logged in
      return NextResponse.json({ ok: false, authenticated: false }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (!state.exists) {
      // user deleted -> clear and force logout
      await clearSession();
      return NextResponse.json({ logout: true, reason: 'missing' }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (state.banned) {
      return NextResponse.json({ ok: true, banned: true, reason: state.reason || null, expires_at: state.expires_at || null }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ ok: true, banned: false }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('Auth ping error', e);
    return NextResponse.json({ ok: false }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
