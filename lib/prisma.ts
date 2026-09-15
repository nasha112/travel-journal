import { PrismaClient } from "@prisma/client";

// Prisma 客户端单例，避免开发环境热重载时重复创建连接
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
