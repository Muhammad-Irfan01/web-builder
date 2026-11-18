import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const project = await prisma.project.findFirst({
    where: { apiKey: { not: null } }
  });
  if (!project) {
    console.log('No project with API key found');
    process.exit(0);
  }
  console.log('Found project:', project.id, project.storeId);
  console.log('API key:', project.apiKey ? 'Present' : 'None');

  const url = `http://localhost:3000/api/products`;
  console.log('Fetching from', url);
  try {
    const res = await fetch(url, {
      headers: {
        'x-store-id': project.storeId,
        'Authorization': `Bearer ${project.apiKey}`
      }
    });
    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Total products:', data.total ?? data.data?.length ?? data.length);
    const first = (data.data || data)[0];
    console.log('First product fields:', Object.keys(first || {}));
    console.log('First product JSON:', JSON.stringify(first, null, 2));
  } catch (e) {
    console.error('Error fetching products:', e);
  }
  await prisma.$disconnect();
}

run();
