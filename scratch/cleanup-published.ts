import { PrismaClient } from '@prisma/client';
// Use the custom builder's schema
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('--- Starting Publish Status Cleanup ---');

  // 1. Get all stores that have published projects
  const storesWithPublished = await prisma.$queryRaw`
    SELECT "storeId", COUNT(*) as count 
    FROM builder.projects 
    WHERE "isPublished" = true 
    GROUP BY "storeId" 
    HAVING COUNT(*) > 1
  ` as any[];

  console.log(`Found ${storesWithPublished.length} stores with multiple published projects.`);

  for (const store of storesWithPublished) {
    const storeId = store.storeId;
    
    // 2. For each store, find the most recently updated project
    const latestPublished = await prisma.project.findFirst({
      where: { storeId, isPublished: true },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true }
    });

    if (latestPublished) {
      console.log(`Store ${storeId}: Keeping "${latestPublished.title}" (${latestPublished.id}) as live.`);
      
      // 3. Unpublish all other projects for this store
      const result = await prisma.project.updateMany({
        where: { 
          storeId, 
          isPublished: true,
          id: { not: latestPublished.id } 
        },
        data: { isPublished: false }
      });
      
      console.log(`  Unpublished ${result.count} older projects.`);
    }
  }

  console.log('--- Cleanup Completed ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
