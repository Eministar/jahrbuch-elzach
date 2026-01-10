'use server';

import { redirect } from 'next/navigation';
import { getSessionWithDbRole } from '@/lib/auth';
import { createUser, deleteUser, updateUserPassword, updateUserRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { getDbPool } from '@/lib/db';
import { ensureModerationSchema, ensureUserClassColumn } from '@/lib/migrations';
import { CLASSES } from '@/lib/constants';

export async function createUserAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) return { error: 'Nicht eingeloggt' };
  if (session.role !== 'admin' && session.role !== 'moderator') return { error: 'Keine Berechtigung' };

  const username = String(formData.get('username') || '').trim();
  const password = String(formData.get('password') || '').trim();
  const klass = String(formData.get('class') || '').trim();

  if (!username || !password) {
    return { error: 'Username und Passwort sind erforderlich' };
  }

  let classValue: string | null = null;
  if (klass) {
    if (!CLASSES.includes(klass)) {
      return { error: 'Ungültige Klasse' };
    }
    classValue = klass;
  }

  try {
    await ensureUserClassColumn();
    await createUser(username, password, 'user', classValue);
    revalidatePath('/admin/user');
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return { error: 'Fehler beim Erstellen des Benutzers' };
  }
}

export async function deleteUserAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/zugriff-verweigert');

  const id = Number(formData.get('id'));
  if (!id) {
    throw new Error('User ID is required');
  }
  
  try {
    await deleteUser(id);
    revalidatePath('/admin/user');
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export async function approveSubmissionAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin' && session.role !== 'moderator') redirect('/zugriff-verweigert');
  await ensureModerationSchema();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Submission ID is required');
  const conn = await getDbPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      "UPDATE submissions SET status='approved', approved_by=?, approved_at=NOW(), deleted_by=NULL, deleted_at=NULL WHERE id=?",
      [session.userId, id]
    );
    await conn.execute(
      "INSERT INTO submission_audit (submission_id, action, actor_user_id) VALUES (?, 'approve', ?)",
      [id, session.userId]
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  revalidatePath('/admin');
}

export async function deleteSubmissionAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin' && session.role !== 'moderator') redirect('/zugriff-verweigert');
  await ensureModerationSchema();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Submission ID is required');
  const conn = await getDbPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      "UPDATE submissions SET status='deleted', deleted_by=?, deleted_at=NOW() WHERE id=?",
      [session.userId, id]
    );
    await conn.execute(
      "INSERT INTO submission_audit (submission_id, action, actor_user_id) VALUES (?, 'delete', ?)",
      [id, session.userId]
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  revalidatePath('/admin');
}

export async function restoreSubmissionAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin' && session.role !== 'moderator') redirect('/zugriff-verweigert');
  await ensureModerationSchema();
  const id = Number(formData.get('id'));
  if (!id) throw new Error('Submission ID is required');
  const conn = await getDbPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      "UPDATE submissions SET status='pending', approved_by=NULL, approved_at=NULL, deleted_by=NULL, deleted_at=NULL WHERE id=?",
      [id]
    );
    await conn.execute(
      "INSERT INTO submission_audit (submission_id, action, actor_user_id) VALUES (?, 'restore', ?)",
      [id, session.userId]
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  revalidatePath('/admin');
}

// Bulk moderation actions
export async function approveManySubmissionsAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin' && session.role !== 'moderator') redirect('/zugriff-verweigert');
  await ensureModerationSchema();
  const ids = formData.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (!ids.length) throw new Error('No submission IDs provided');
  const placeholders = ids.map(() => '?').join(',');
  const conn = await getDbPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE submissions SET status='approved', approved_by=?, approved_at=NOW(), deleted_by=NULL, deleted_at=NULL WHERE id IN (${placeholders})`,
      [session.userId, ...ids]
    );
    const auditValuesPlaceholders = ids.map(() => '(?, \'approve\', ?)').join(',');
    await conn.execute(
      `INSERT INTO submission_audit (submission_id, action, actor_user_id) VALUES ${auditValuesPlaceholders}`,
      ids.flatMap((id) => [id, session.userId])
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  revalidatePath('/admin');
}

export async function deleteManySubmissionsAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin' && session.role !== 'moderator') redirect('/zugriff-verweigert');
  await ensureModerationSchema();
  const ids = formData.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (!ids.length) throw new Error('No submission IDs provided');
  const placeholders = ids.map(() => '?').join(',');
  const conn = await getDbPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      `UPDATE submissions SET status='deleted', deleted_by=?, deleted_at=NOW() WHERE id IN (${placeholders})`,
      [session.userId, ...ids]
    );
    const auditValuesPlaceholders = ids.map(() => '(?, \'delete\', ?)').join(',');
    await conn.execute(
      `INSERT INTO submission_audit (submission_id, action, actor_user_id) VALUES ${auditValuesPlaceholders}`,
      ids.flatMap((id) => [id, session.userId])
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  revalidatePath('/admin');
}


// Admin-only: update user password
export async function updateUserPasswordAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/zugriff-verweigert');
  const id = Number(formData.get('id'));
  const password = String(formData.get('password') || '').trim();
  if (!id || !password) throw new Error('User ID and new password are required');
  await updateUserPassword(id, password);
  revalidatePath('/admin/user');
}

// Admin-only: update user role
export async function updateUserRoleAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/zugriff-verweigert');
  const id = Number(formData.get('id'));
  const role = String(formData.get('role') || '').trim();
  if (!id || !['user','moderator','admin'].includes(role)) throw new Error('Invalid role update');
  await updateUserRole(id, role as 'user' | 'moderator' | 'admin');
  revalidatePath('/admin/user');
  const returnToRaw = String(formData.get('return_to') || '').trim();
  const returnTo = returnToRaw.startsWith('/') ? returnToRaw : '/admin/user';
  redirect(returnTo);
}

// Admin-only: ban user
export async function banUserAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/zugriff-verweigert');
  const userId = Number(formData.get('user_id'));
  const reason = String(formData.get('reason') || '').trim() || null;
  const expiresRaw = String(formData.get('expires_at') || '').trim();
  let expires_at: string | null = null;
  if (expiresRaw) {
    const d = new Date(expiresRaw);
    if (!isNaN(d.getTime())) {
      expires_at = d.toISOString().slice(0, 19).replace('T', ' ');
    }
  }
  const conn = getDbPool();
  await conn.execute(
    'INSERT INTO banned_users (user_id, reason, expires_at, created_by) VALUES (?, ?, ?, ?)',
    [userId, reason, expires_at, session.userId]
  );
  revalidatePath('/admin/user');
}

export async function unbanUserAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/zugriff-verweigert');
  const userId = Number(formData.get('user_id'));
  const conn = getDbPool();
  await conn.execute('DELETE FROM banned_users WHERE user_id = ?', [userId]);
  revalidatePath('/admin/user');
}

// Admin-only: ban IP
export async function banIpAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/zugriff-verweigert');
  const ip = String(formData.get('ip') || '').trim();
  if (!ip) throw new Error('IP is required');
  const reason = String(formData.get('reason') || '').trim() || null;
  const expiresRaw = String(formData.get('expires_at') || '').trim();
  let expires_at: string | null = null;
  if (expiresRaw) {
    const d = new Date(expiresRaw);
    if (!isNaN(d.getTime())) {
      expires_at = d.toISOString().slice(0, 19).replace('T', ' ');
    }
  }
  const conn = getDbPool();
  await conn.execute(
    `INSERT INTO banned_ips (ip, reason, expires_at, created_by) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE reason=VALUES(reason), expires_at=VALUES(expires_at), created_by=VALUES(created_by), created_at=CURRENT_TIMESTAMP`,
    [ip, reason, expires_at, session.userId]
  );
  revalidatePath('/admin/user');
}

export async function unbanIpAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/zugriff-verweigert');
  const ip = String(formData.get('ip') || '').trim();
  const conn = getDbPool();
  await conn.execute('DELETE FROM banned_ips WHERE ip = ?', [ip]);
  revalidatePath('/admin');
}

// Admin-only: toggle phase
export async function togglePhaseAction(formData: FormData) {
  const session = await getSessionWithDbRole();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/zugriff-verweigert');

  const phaseKey = String(formData.get('phaseKey') || '').trim();
  const enabled = formData.get('enabled') === 'true';

  if (!phaseKey) {
    throw new Error('Phase key is required');
  }

  const conn = await getDbPool().getConnection();
  try {
    await conn.execute(
      'UPDATE phase_settings SET enabled = ?, updated_by = ?, updated_at = NOW() WHERE phase_key = ?',
      [enabled, session.userId, phaseKey]
    );

    console.log(`Phase ${phaseKey} wurde ${enabled ? 'aktiviert' : 'deaktiviert'}`);
  } catch (error) {
    console.error('Error toggling phase:', error);
    throw error;
  } finally {
    conn.release();
  }

  // Revalidate alle relevanten Pfade - mit kleiner Verzögerung für DB-Replikation
  await new Promise(resolve => setTimeout(resolve, 100));

  revalidatePath('/admin', 'page');
  revalidatePath('/', 'page');
  revalidatePath('/phase-1', 'page');
  revalidatePath('/phase-2', 'page');
  revalidatePath('/phase-3', 'page');
  revalidatePath('/admin', 'layout');
  revalidatePath('/', 'layout');

  redirect('/admin');
}
