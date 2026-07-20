import { PrismaClient } from "@prisma/client";

/**
 * Vercel singleton pattern — prevents connection leaks across serverless
 * invocations. See: https://www.prisma.io/docs/guides/serverless-platforms/vercel
 */
declare global {
  // eslint-disable-next-line no-var
  var prismaForPulse: PrismaClient | undefined;
}

const prisma = global.prismaForPulse ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismaForPulse = prisma;
}

export { prisma };
