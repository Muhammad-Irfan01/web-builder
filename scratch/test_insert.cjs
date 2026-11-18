const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testInsert() {
  console.log("=== Testing Database Insertion of Custom Domain ===");
  const testHost = "shop.example.com";
  const projectId = "443ba554-b6d4-49a3-bdab-3b7b923a94ae";
  const storeId = "cmo7aimu90000p601kv9hi4db";

  try {
    // 1. Delete if already exists in DB
    await prisma.domain.deleteMany({
      where: { hostname: testHost }
    });
    console.log("-> Deleted any existing test domain records.");

    // 2. Try inserting
    const newDomain = await prisma.domain.create({
      data: {
        hostname: testHost,
        type: 'CUSTOM',
        projectId: projectId,
        storeId: storeId,
        isVerified: false,
        isPrimary: false
      }
    });
    console.log("-> Successfully inserted domain! Result:", newDomain);

    // 3. Delete it again to keep DB clean
    await prisma.domain.delete({
      where: { id: newDomain.id }
    });
    console.log("-> Successfully cleaned up test domain from DB.");
  } catch (err) {
    console.error("-> Insertion failed! Error details:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testInsert();
