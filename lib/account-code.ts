import { prisma } from './prisma';

/**
 * Generates a unique account code for Telegram bot authentication
 * Format: 6 random uppercase letters and numbers
 */
export function generateAccountCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like 0, O, I, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generates a unique account code that doesn't exist in the database
 */
export async function generateUniqueAccountCode(): Promise<string> {
  let code: string;
  let exists = true;
  
  while (exists) {
    code = generateAccountCode();
    const existingUser = await prisma.user.findUnique({
      where: { accountCode: code },
    });
    exists = !!existingUser;
  }
  
  return code!;
}

/**
 * Ensures user has an account code, generates one if missing
 */
export async function ensureUserAccountCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountCode: true },
  });

  if (user?.accountCode) {
    return user.accountCode;
  }

  // Generate and save new code
  const newCode = await generateUniqueAccountCode();
  await prisma.user.update({
    where: { id: userId },
    data: { accountCode: newCode },
  });

  return newCode;
}


















