import { NextRequest, NextResponse } from 'next/server';
import { getAuthState } from '@/lib/auth';
import { getDbPool } from '@/lib/db';
import { ensureModerationSchema } from '@/lib/migrations';
import type { RowDataPacket } from 'mysql2';

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

    const { submissionId, voteType } = await req.json();

    if (!submissionId || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const conn = await getDbPool().getConnection();
    try {
      // Prüfe ob User bereits gevoted hat
      const [existing] = await conn.execute<RowDataPacket[]>(
        'SELECT vote_type FROM submission_votes WHERE user_id = ? AND submission_id = ?',
        [state.session.userId, submissionId]
      );

      if (existing.length > 0) {
        if (existing[0].vote_type === voteType) {
          // Vote entfernen
          await conn.execute(
            'DELETE FROM submission_votes WHERE user_id = ? AND submission_id = ?',
            [state.session.userId, submissionId]
          );
          return NextResponse.json({ success: true, action: 'removed' });
        } else {
          // Vote ändern
          await conn.execute(
            'UPDATE submission_votes SET vote_type = ?, updated_at = NOW() WHERE user_id = ? AND submission_id = ?',
            [voteType, state.session.userId, submissionId]
          );
          return NextResponse.json({ success: true, action: 'updated' });
        }
      } else {
        // Neuer Vote
        await conn.execute(
          'INSERT INTO submission_votes (user_id, submission_id, vote_type) VALUES (?, ?, ?)',
          [state.session.userId, submissionId, voteType]
        );
        return NextResponse.json({ success: true, action: 'created' });
      }
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

