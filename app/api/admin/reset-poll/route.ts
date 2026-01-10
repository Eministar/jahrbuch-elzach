import { NextResponse } from 'next/server';
import { getSessionWithDbRole } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getSessionWithDbRole();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const conn = await getDbPool().getConnection();

    try {
      await conn.beginTransaction();

      // Lösche alle Poll-Antworten des Users
      await conn.execute(
        'DELETE FROM poll_responses WHERE user_id = ?',
        [userId]
      );

      // Lösche den Submission-Status
      await conn.execute(
        'DELETE FROM poll_submissions WHERE user_id = ?',
        [userId]
      );

      await conn.commit();

      return NextResponse.json({ success: true });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error resetting poll:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

