import { db } from '@/lib/db'
import { userTokens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { decryptToken } from '@/lib/encryption'

/**
 * Retrieves and decrypts a user's Figma token
 * @param userId - The user's ID
 * @returns The decrypted Figma token
 * @throws Error if no token is found
 */
export async function getFigmaToken(userId: string): Promise<string> {
  const result = await db
    .select({
      figmaToken: userTokens.figmaToken,
    })
    .from(userTokens)
    .where(eq(userTokens.userId, userId))
    .limit(1)

  if (result.length === 0) {
    throw new Error('No Figma token found. Please add your token in settings.')
  }

  const encryptedToken = result[0].figmaToken
  return decryptToken(encryptedToken)
}

/**
 * Checks if a user has a Figma token stored
 * @param userId - The user's ID
 * @returns True if the user has a token
 */
export async function hasFigmaToken(userId: string): Promise<boolean> {
  const result = await db
    .select({
      exists: userTokens.userId,
    })
    .from(userTokens)
    .where(eq(userTokens.userId, userId))
    .limit(1)

  return result.length > 0
}
