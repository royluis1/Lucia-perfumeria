const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'admin@lucia.test' },
    data: { role: 'ADMIN' }
  });
  console.log('User updated to ADMIN:', user.email, user.role);
  await prisma.$disconnect();
}

main().catch(console.error);