const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany();
  console.log('Total Projects in DB:', projects.length);
  projects.forEach(p => {
    console.log(`- Project ID: ${p.id}, Title: "${p.title}", Slug: "${p.slug}", isPublished: ${p.isPublished}, storeId: ${p.storeId}`);
  });
  
  const domains = await prisma.domain.findMany();
  console.log('Total Domains in DB:', domains.length);
  domains.forEach(d => {
    console.log(`- Domain ID: ${d.id}, Hostname: "${d.hostname}", isPrimary: ${d.isPrimary}, isVerified: ${d.isVerified}, projectId: ${d.projectId}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
