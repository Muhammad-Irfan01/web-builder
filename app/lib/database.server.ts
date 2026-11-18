import pkg from '@prisma/client';
const { PrismaClient } = pkg;

declare global {
  var __db__: any;
}

if (!global.__db__) {
  global.__db__ = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

const prisma = global.__db__;

export { prisma };
