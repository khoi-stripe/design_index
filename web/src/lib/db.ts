/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";

const DEMO_MODE = process.env.DEMO_MODE === "true";

let _prisma: any;

if (DEMO_MODE) {
  // Dynamic import is evaluated at module load; static-db re-exports a
  // Prisma-compatible interface backed by fixtures.json.
  const { staticPrisma } = require("./static-db");
  _prisma = staticPrisma;
} else {
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
  _prisma = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _prisma;
}

export const prisma: any = _prisma;
export const isDemoMode = DEMO_MODE;
