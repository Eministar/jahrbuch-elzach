import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { ensureUserProfileColumns } from '@/lib/migrations';
import path from 'path';
import fs from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureUserProfileColumns();

  const rows = await query<{ id: number; username: string; class: string | null; bio: string | null; avatar_url: string | null; banner_url: string | null }[]>(
    'SELECT id, username, class, bio, avatar_url, banner_url FROM users WHERE id = ? LIMIT 1',
    [session.userId]
  );
  const user = rows[0] || null;
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureUserProfileColumns();

  type Body = { bio?: string; avatar_url?: string | null; banner_url?: string | null };
  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const bioRaw = typeof body?.bio === 'string' ? body.bio : '';
  const avatarUrlRaw = typeof body?.avatar_url === 'string' ? body.avatar_url : '';
  const bannerUrlRaw = typeof body?.banner_url === 'string' ? body.banner_url : '';

  const bio = bioRaw.trim().slice(0, 2000); // limit bio length
  const newAvatarUrl = (avatarUrlRaw.trim().slice(0, 255)) || null;
  const newBannerUrl = (bannerUrlRaw.trim().slice(0, 255)) || null;

  // Load existing avatar/banner to clean up file on removal/replacement
  const currentRows = await query<{ avatar_url: string | null; banner_url: string | null }[]>(
    'SELECT avatar_url, banner_url FROM users WHERE id = ? LIMIT 1',
    [session.userId]
  );
  const oldAvatarUrl = currentRows[0]?.avatar_url || null;
  const oldBannerUrl = currentRows[0]?.banner_url || null;

  // Update DB first
  await query(
    'UPDATE users SET bio = ?, avatar_url = ?, banner_url = ? WHERE id = ? LIMIT 1',
    [bio || null, newAvatarUrl, newBannerUrl, session.userId]
  );

  // If avatar changed and the old file is ours, try to delete it (best-effort)
  try {
    if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
      const rel = oldAvatarUrl.replace(/^\//, '');
      const filePath = path.join(process.cwd(), 'public', rel);
      await fs.unlink(filePath).catch(() => {});
    }
  } catch {}

  // If banner changed and the old file is ours, try to delete it (best-effort)
  try {
    if (oldBannerUrl && oldBannerUrl !== newBannerUrl && oldBannerUrl.startsWith('/uploads/banners/')) {
      const rel = oldBannerUrl.replace(/^\//, '');
      const filePath = path.join(process.cwd(), 'public', rel);
      await fs.unlink(filePath).catch(() => {});
    }
  } catch {}

  return NextResponse.json({ success: true });
}
