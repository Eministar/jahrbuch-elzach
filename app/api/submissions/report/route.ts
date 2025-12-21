import { NextRequest, NextResponse } from 'next/server';
import { getAuthState } from '@/lib/auth';
import { getDbPool } from '@/lib/db';
import { ensureModerationSchema } from '@/lib/migrations';
import type { ResultSetHeader } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const state = await getAuthState();
    if (!state.session || !state.exists) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
    if (state.banned) {
      return NextResponse.json({ error: 'Banned' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }

    await ensureModerationSchema();

    const { submissionId, reason } = await req.json();

    if (!submissionId || !reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const conn = await getDbPool().getConnection();
    try {
      await conn.execute<ResultSetHeader>(
        'INSERT INTO submission_reports (submission_id, reporter_user_id, reason) VALUES (?, ?, ?)',
        [submissionId, state.session.userId, reason.slice(0, 1000)]
      );

      return NextResponse.json({ success: true });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

