import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Checking and fixing database types...");
  try {
    // Check if the enum already exists
    const checkEnum = await prisma.$queryRawUnsafe(`
      SELECT exists (
        SELECT 1 FROM pg_type t 
        JOIN pg_namespace n ON t.typnamespace = n.oid 
        WHERE t.typname = 'DomainType' AND n.nspname = 'builder'
      );
    `);
    
    const exists = checkEnum[0]?.exists;
    console.log("Enum 'builder.DomainType' exists:", exists);
    
    if (!exists) {
      console.log("Creating missing type 'builder.DomainType'...");
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "builder"."DomainType" AS ENUM ('SYSTEM', 'CUSTOM');
      `);
      console.log("Successfully created enum 'builder.DomainType' in schema 'builder'!");
    } else {
      console.log("Enum 'builder.DomainType' already exists, no action needed.");
    }
  } catch (error) {
    console.error("Error creating database type:", error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
