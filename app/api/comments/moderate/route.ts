import { NextRequest, NextResponse } from 'next/server';
import { getAuthState } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const state = await getAuthState();
    if (!state.session || !state.exists) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
    if (state.banned) {
      return NextResponse.json({ error: 'Banned' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }

    // Only moderators and admins can delete comments
    if (state.session.role !== 'moderator' && state.session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }

    const body = await req.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const conn = await getDbPool().getConnection();
    try {
      await conn.query(
        `UPDATE comments SET status = 'deleted', deleted_by = ?, deleted_at = NOW() WHERE id = ?`,
        [state.session.userId, commentId]
      );

      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

