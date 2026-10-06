import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName ? { displayName } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database user operation failed:', error);
    throw new Error('Database user operation failed.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const userRecords = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return userRecords[0] || null;
  } catch (error) {
    console.error('Failed to fetch user by UID:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}
