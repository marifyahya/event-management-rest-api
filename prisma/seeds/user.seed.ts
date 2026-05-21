import bcrypt from 'bcrypt';
import { PrismaClient } from '../../src/generated/prisma/client.js';

export async function seedUsers(prisma: PrismaClient) {
  const password = await bcrypt.hash('password', 10);

  await prisma.user.upsert({
    where: {
      email: 'admin@example.com',
    },
    update: {},
    create: {
      fullName: 'Admin User',
      email: 'admin@example.com',
      password,
      role: 'admin',
      isActive: true,
    },
  });
}
