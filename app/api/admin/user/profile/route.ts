import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithDbRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { ensureUserProfileColumns } from '@/lib/migrations';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getSessionWithDbRole();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureUserProfileColumns();

  type Body = { userId?: number; bio?: string; avatar_url?: string | null; banner_url?: string | null };
  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const userId = Number(body?.userId || 0);
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const bioRaw = typeof body?.bio === 'string' ? body.bio : '';
  const avatarUrlRaw = body?.avatar_url === null ? null : (typeof body?.avatar_url === 'string' ? body.avatar_url : '');
  const bannerUrlRaw = body?.banner_url === null ? null : (typeof body?.banner_url === 'string' ? body.banner_url : '');

  const bio = bioRaw.trim().slice(0, 2000) || null;
  const newAvatarUrl = avatarUrlRaw === null ? null : ((avatarUrlRaw || '').trim().slice(0, 255) || null);
  const newBannerUrl = bannerUrlRaw === null ? null : ((bannerUrlRaw || '').trim().slice(0, 255) || null);

  // Load existing avatar to clean up file on removal/replacement
  const currentRows = await query<{ avatar_url: string | null; banner_url: string | null }[]>(
    'SELECT avatar_url, banner_url FROM users WHERE id = ? LIMIT 1',
    [userId]
  );
  if (!currentRows[0]) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const oldAvatarUrl = currentRows[0]?.avatar_url || null;
  const oldBannerUrl = currentRows[0]?.banner_url || null;

  // Update DB first
  await query(
    'UPDATE users SET bio = ?, avatar_url = ?, banner_url = ? WHERE id = ? LIMIT 1',
    [bio, newAvatarUrl, newBannerUrl, userId]
  );

  // If avatar changed and the old file is ours, try to delete it (best-effort)
  try {
    if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
      const rel = oldAvatarUrl.replace(/^\//, '');
      const filePath = path.join(process.cwd(), 'public', rel);
      await fs.unlink(filePath).catch(() => {});
    }
  } catch {
    // ignore cleanup errors
  }

  try {
    if (oldBannerUrl && oldBannerUrl !== newBannerUrl && oldBannerUrl.startsWith('/uploads/banners/')) {
      const rel = oldBannerUrl.replace(/^\//, '');
      const filePath = path.join(process.cwd(), 'public', rel);
      await fs.unlink(filePath).catch(() => {});
    }
  } catch {
    // ignore cleanup errors
  }

  return NextResponse.json({ success: true });
}
