const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEnum() {
  console.log("=== Aligning domains.type Enum with Default Constraint Drop/Restore ===");
  try {
    console.log("1. Dropping default constraint...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "builder"."domains" ALTER COLUMN "type" DROP DEFAULT;
    `);

    console.log("2. Altering column type with USING cast...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "builder"."domains" 
      ALTER COLUMN "type" TYPE "builder"."DomainType" 
      USING "type"::text::"builder"."DomainType";
    `);

    console.log("3. Restoring default constraint under builder.DomainType...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "builder"."domains" ALTER COLUMN "type" SET DEFAULT 'SYSTEM'::"builder"."DomainType";
    `);

    console.log("-> Successfully and completely aligned domains.type enums!");
  } catch (err) {
    console.error("-> Failed! Error details:", err);
  } finally {
    await prisma.$disconnect();
  }
}

fixEnum();
