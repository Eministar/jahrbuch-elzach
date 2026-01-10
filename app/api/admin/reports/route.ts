import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithDbRole } from '@/lib/auth';
import { getDbPool } from '@/lib/db';
import { ensureModerationSchema } from '@/lib/migrations';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithDbRole();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Nur Moderatoren und Admins
    if (session.role !== 'moderator' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureModerationSchema();

    const { reportId, action } = await req.json();

    if (!reportId || !['reviewed', 'dismissed'].includes(action)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const conn = await getDbPool().getConnection();
    try {
      await conn.execute(
        'UPDATE submission_reports SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
        [action, session.userId, reportId]
      );

      return NextResponse.json({ success: true });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Review report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

