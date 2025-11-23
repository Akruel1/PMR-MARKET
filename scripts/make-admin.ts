import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'tecca5864@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log(`❌ User with email ${email} not found`);
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });

  console.log(`✅ User ${email} is now an ADMIN`);
  console.log(`   ID: ${updated.id}`);
  console.log(`   Name: ${updated.name || 'N/A'}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
