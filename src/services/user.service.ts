import { prisma } from '../db/index.js';
import bcrypt from 'bcrypt';
import { NotFoundError } from '../utils/app-error.js';

class UserService {
  async register(user: { fullname: string; email: string; password: string }) {
    const newUser = await prisma.user.create({
      data: {
        fullName: user.fullname,
        email: user.email,
        password: await bcrypt.hash(user.password, 10),
      },
    });

    return newUser;
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  updateLastLogin(userId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
  comparePassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

export const userService = new UserService();
