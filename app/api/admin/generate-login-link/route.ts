import { NextResponse } from 'next/server';
import { getSessionWithDbRole } from '@/lib/auth';
import { updateUserPassword } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSessionWithDbRole();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as { userId?: number; password?: string } | null;
  const userId = Number(body?.userId || 0);
  const password = String(body?.password || '').trim();
  if (!userId || !password) {
    return NextResponse.json({ success: false, error: 'Missing userId or password' }, { status: 400 });
  }

  // Get username for link
  const users = await query<{ username: string }[]>(
    'SELECT username FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  const username = users[0]?.username;
  if (!username) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  // Set the new password (hashed in DB)
  await updateUserPassword(userId, password);

  // Build absolute URL for login link
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim();
  const base = `${proto}://${host}`;
  const link = `${base}/login?user=${encodeURIComponent(username)}&pass=${encodeURIComponent(password)}`;

  return NextResponse.json({ success: true, link, username, password });
}
