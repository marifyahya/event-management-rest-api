import { prisma, prismaRaw } from '../db/index.js';
import bcrypt from 'bcrypt';

class UserService {
  async register(user: { fullName: string; email: string; password: string }) {
    const newUser = await prisma.user.create({
      data: {
        fullName: user.fullName,
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

  findByEmailIncludePassword(email: string) {
    return prismaRaw.user.findUnique({
      where: { email },
      omit: { password: false },
    });
  }

  findByIdIncludingDeleted(id: number) {
    return prismaRaw.user.findUnique({
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

  async getAllUser(query: {
    page?: number;
    limit?: number;
    name?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.name && {
        fullName: {
          contains: query.name,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.email && {
        email: {
          contains: query.email,
          mode: 'insensitive' as const,
        },
      }),
      ...(query.role && {
        role: query.role,
      }),
      ...(typeof query.isActive === 'boolean' && {
        isActive: query.isActive,
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),

      prisma.user.count({
        where,
      }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async store(user: { fullName: string; email: string; password: string; role?: string; isActive?: boolean }) {
    const password = await bcrypt.hash(user.password, 10);
    return prisma.user.create({
      data: {
        fullName: user.fullName,
        email: user.email,
        password: password,
        role: user.role,
        isActive: user.isActive,
      },
    });
  }

  async update(
    id: number,
    user: { fullName?: string; email?: string; password?: string; role?: string; isActive?: boolean },
  ) {
    const data = Object.fromEntries(Object.entries(user).filter(([, v]) => v !== undefined));

    if (data.password) {
      data.password = await bcrypt.hash(user.password as string, 10);
    }

    return prisma.user.update({
      where: { id },
      data: data,
    });
  }

  async delete(id: number) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const userService = new UserService();
