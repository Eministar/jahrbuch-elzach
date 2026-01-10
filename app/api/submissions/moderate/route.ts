import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithDbRole } from '@/lib/auth';
import { getDbPool } from '@/lib/db';
import { ensureModerationSchema } from '@/lib/migrations';
import type { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionWithDbRole();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Nur Moderatoren und Admins dürfen moderieren
    if (session.role !== 'moderator' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await ensureModerationSchema();

    const { submissionId, action, reason } = await req.json();

    if (!submissionId || !['delete', 'ban'].includes(action)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const conn = await getDbPool().getConnection();
    try {
      await conn.beginTransaction();

      if (action === 'delete') {
        // Submission löschen
        await conn.execute(
          'UPDATE submissions SET status = ?, deleted_by = ?, deleted_at = NOW() WHERE id = ?',
          ['deleted', session.userId, submissionId]
        );

        // Audit Log
        await conn.execute(
          "INSERT INTO submission_audit (submission_id, action, actor_user_id) VALUES (?, 'delete', ?)",
          [submissionId, session.userId]
        );
      } else if (action === 'ban') {
        // User der Submission finden
        interface UserRow extends RowDataPacket {
          user_id: number;
        }

        const [rows] = await conn.execute<UserRow[]>(
          'SELECT user_id FROM submissions WHERE id = ?',
          [submissionId]
        );

        if (rows.length > 0) {
          const userId = rows[0].user_id;

          // User bannen
          await conn.execute(
            'INSERT INTO banned_users (user_id, reason, created_by) VALUES (?, ?, ?)',
            [userId, reason || 'Verstoß gegen Community-Richtlinien', session.userId]
          );

          // Alle Submissions des Users löschen
          await conn.execute(
            'UPDATE submissions SET status = ?, deleted_by = ?, deleted_at = NOW() WHERE user_id = ?',
            ['deleted', session.userId, userId]
          );
        }
      }

      await conn.commit();
      return NextResponse.json({ success: true });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Moderate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
