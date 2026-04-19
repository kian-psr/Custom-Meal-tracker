import "server-only";

import { randomBytes } from "node:crypto";

import { hashScopedToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PASSWORD_RESET_SCOPE = "password-reset";
const PASSWORD_RESET_TTL_MINUTES = 60;

function hashPasswordResetToken(token: string) {
  return hashScopedToken(token, PASSWORD_RESET_SCOPE);
}

export async function createPasswordResetToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000
  );

  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        {
          userId,
        },
        {
          expiresAt: {
            lt: new Date(),
          },
        },
      ],
    },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashPasswordResetToken(token),
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
  };
}

export async function consumePasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: {
      tokenHash: hashPasswordResetToken(token),
    },
    include: {
      user: true,
    },
  });

  if (!record) {
    return null;
  }

  if (record.usedAt || record.expiresAt <= new Date()) {
    return null;
  }

  return record;
}

export async function markPasswordResetUsed(tokenId: string) {
  await prisma.passwordResetToken.update({
    where: {
      id: tokenId,
    },
    data: {
      usedAt: new Date(),
    },
  });
}

export async function clearPasswordResetTokensForUser(userId: string) {
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId,
    },
  });
}

export { PASSWORD_RESET_TTL_MINUTES };
