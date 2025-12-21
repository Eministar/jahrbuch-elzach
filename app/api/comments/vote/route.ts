import { NextRequest, NextResponse } from 'next/server';
import { getAuthState } from '@/lib/auth';
import { getDbPool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

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

    const body = await req.json();
    const { commentId, voteType } = body;

    if (!commentId || !voteType || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const conn = await getDbPool().getConnection();
    try {
      // Check if user already voted
      const [existing] = await conn.query<RowDataPacket[]>(
        `SELECT vote_type FROM comment_votes WHERE comment_id = ? AND user_id = ?`,
        [commentId, state.session.userId]
      );

      if (existing.length > 0) {
        const currentVote = existing[0].vote_type;

        if (currentVote === voteType) {
          // Remove vote (toggle off)
          await conn.query(
            `DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?`,
            [commentId, state.session.userId]
          );
        } else {
          // Change vote
          await conn.query(
            `UPDATE comment_votes SET vote_type = ? WHERE comment_id = ? AND user_id = ?`,
            [voteType, commentId, state.session.userId]
          );
        }
      } else {
        // New vote
        await conn.query(
          `INSERT INTO comment_votes (comment_id, user_id, vote_type) VALUES (?, ?, ?)`,
          [commentId, state.session.userId, voteType]
        );
      }

      return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Failed to vote on comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
