import { getDbPool } from './db';
import { getSession, clearSession, type SessionPayload } from './session';
import { ensureModerationSchema } from './migrations';
import type { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcrypt';

export type AuthState = {
  session: SessionPayload | null;
  exists: boolean;
  banned: boolean;
  reason?: string | null;
  expires_at?: string | null;
};

export async function getAuthState(): Promise<AuthState> {
  const session = await getSession();
  if (!session) {
    return { session: null, exists: false, banned: false };
  }

  // Ensure moderation schema so banned_users table exists before querying
  await ensureModerationSchema().catch(() => {});

  const conn = await getDbPool().getConnection();
  try {
    type UserRow = RowDataPacket & { id: number; role: 'user' | 'moderator' | 'admin' };
    const [userRows] = await conn.execute<UserRow[]>(
      'SELECT id, role FROM users WHERE id = ? LIMIT 1',
      [session.userId]
    );
    if (userRows.length === 0) {
      // user removed
      return { session, exists: false, banned: false };
    }
    const dbRole = userRows[0]?.role;
    const sessionWithRole = dbRole ? { ...session, role: dbRole } : session;

    // Check active ban (best-effort: ignore errors if table/query missing)
    try {
      type BanRow = RowDataPacket & { reason: string | null; expires_at: Date | string | null };
      const [banRows] = await conn.execute<BanRow[]>(
        `SELECT reason, expires_at FROM banned_users WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY id DESC LIMIT 1`,
        [session.userId]
      );
      if (banRows.length > 0) {
        const ban = banRows[0];
        const expiresIso = (() => {
          const v = ban.expires_at;
          if (!v) return null;
          if (v instanceof Date) return v.toISOString();
          const d = new Date(v);
          return isNaN(d.getTime()) ? null : d.toISOString();
        })();
        return {
          session: sessionWithRole,
          exists: true,
          banned: true,
          reason: ban.reason ?? null,
          expires_at: expiresIso,
        };
      }
    } catch {
      // ignore ban query errors
    }

    return { session: sessionWithRole, exists: true, banned: false };
  } finally {
    conn.release();
  }
}

export async function getSessionWithDbRole(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  const pool = getDbPool();
  type RoleRow = RowDataPacket & { role: 'user' | 'moderator' | 'admin' };
  const [rows] = await pool.execute<RoleRow[]>(
    'SELECT role FROM users WHERE id = ? LIMIT 1',
    [session.userId]
  );
  if (!rows[0]?.role) return session;
  return { ...session, role: rows[0].role };
}

export async function ensureNotBanned(): Promise<{ ok: true; session: SessionPayload } | { ok: false; status: 401 | 403; reason: string }> {
  const state = await getAuthState();
  if (!state.session) {
    await clearSession();
    return { ok: false, status: 401, reason: 'Unauthorized' };
  }
  if (!state.exists) {
    await clearSession();
    return { ok: false, status: 401, reason: 'User not found' };
  }
  if (state.banned) return { ok: false, status: 403, reason: 'Banned' };
  return { ok: true, session: state.session };
}

// --- Missing helpers used across the app ---

export type UserRecord = {
  id: number;
  username: string;
  password_hash: string;
  role: 'user' | 'moderator' | 'admin';
  class?: string | null;
};

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const pool = getDbPool();
  type Row = RowDataPacket & UserRecord;
  const [rows] = await pool.execute<Row[]>(
    'SELECT id, username, password_hash, role, class FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  if (rows.length === 0) return null;
  return rows[0];
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    // Accept exact match as fallback if stored as plain (for temporary links)
    if (!hash || hash.length < 20) {
      return plain === hash;
    }
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export async function createUser(
  username: string,
  password: string,
  role: 'user' | 'moderator' | 'admin' = 'user',
  klass: string | null = null
): Promise<void> {
  const pool = getDbPool();
  const password_hash = await bcrypt.hash(password, 10);
  await pool.execute(
    'INSERT INTO users (username, password_hash, password_plain, role, class) VALUES (?, ?, ?, ?, ?)',
    [username, password_hash, password, role, klass]
  );
}

export async function updateUserPassword(userId: number, newPassword: string): Promise<void> {
  const pool = getDbPool();
  const password_hash = await bcrypt.hash(newPassword, 10);
  await pool.execute(
    'UPDATE users SET password_hash = ?, password_plain = ? WHERE id = ?',
    [password_hash, newPassword, userId]
  );
}

export async function updateUserRole(userId: number, role: 'user' | 'moderator' | 'admin'): Promise<void> {
  const pool = getDbPool();
  await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
}

export async function deleteUser(userId: number): Promise<void> {
  const conn = await getDbPool().getConnection();
  try {
    await conn.beginTransaction();
    // Clean up possible FK constraints that don’t cascade
    try {
      await conn.execute('DELETE FROM banned_users WHERE user_id = ?', [userId]);
    } catch {
      // ignore
    }
    await conn.execute('DELETE FROM users WHERE id = ?', [userId]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
