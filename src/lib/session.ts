import crypto from 'crypto';
import { db } from '@/lib/db';

const SESSION_EXPIRY_DAYS = 30;

/**
 * Generate a cryptographically secure session token (256 bits)
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a raw token for storage/lookup (SHA-256).
 * The raw token is sent to the client; only the hash is stored in DB.
 */
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Create a new session in the database
 */
export async function createSession(meta?: {
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ token: string; expiresAt: Date }> {
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  await db.session.create({
    data: {
      token: tokenHash,
      expiresAt,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
    },
  });

  return { token: rawToken, expiresAt };
}

/**
 * Validate a session token against the database
 * Returns true if the session exists and is not expired
 * Deletes expired sessions on encounter
 */
export async function validateSession(rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken);
  const session = await db.session.findUnique({
    where: { token: tokenHash },
  });

  if (!session) {
    return false;
  }

  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { token: tokenHash } }).catch(() => {});
    return false;
  }

  return true;
}

/**
 * Revoke (delete) a specific session
 */
export async function revokeSession(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await db.session.delete({ where: { token: tokenHash } }).catch(() => {});
}

/**
 * Revoke all sessions
 */
export async function revokeAllSessions(): Promise<void> {
  await db.session.deleteMany();
}

/**
 * Delete all expired sessions from the database
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await db.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}

/**
 * Get session info for display (settings page)
 */
export async function getSessionInfo(
  rawToken: string
): Promise<{ active: boolean; createdAt: Date; expiresAt: Date } | null> {
  const tokenHash = hashToken(rawToken);
  const session = await db.session.findUnique({
    where: { token: tokenHash },
    select: { createdAt: true, expiresAt: true },
  });

  if (!session) {
    return null;
  }

  const active = session.expiresAt > new Date();
  return {
    active,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  };
}
