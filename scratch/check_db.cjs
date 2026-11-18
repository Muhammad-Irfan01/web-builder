const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDomains() {
  console.log("=== Querying Connected Domains in Database ===");
  try {
    const domains = await prisma.domain.findMany({
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${domains.length} domains:`);
    domains.forEach(d => {
      console.log(`- Hostname: ${d.hostname}, Type: ${d.type}, ProjectID: ${d.projectId}, Verified: ${d.isVerified}, Primary: ${d.isPrimary}`);
    });
  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDomains();
