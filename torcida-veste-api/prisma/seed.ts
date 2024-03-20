import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create an administrative user
    await prisma.user.create({
      data: {
        email: 'admin@torcidaveste.com.br',
        password: 'T0rc!d@V3$t3',
        role: 'ADMIN',
      },
    });

    console.log('Admin user created successfully.');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
