import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { userService } from '../services/user.service.js';
import { NotFoundError } from '../utils/app-error.js';

export const index = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, name, email, role, isActive } = req.query;
  const query = {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    name: name ? String(name) : undefined,
    email: email ? String(email) : undefined,
    role: role ? String(role) : undefined,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  };

  const users = await userService.getAllUser(query);

  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: users.data,
    pagination: users.pagination,
  });
});

export const show = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await userService.findById(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    message: 'User retrieved successfully',
    data: user,
  });
});

export const store = asyncHandler(async (req: Request, res: Response) => {
  const findUser = await userService.findByEmail(req.body.email);
  if (findUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already exists',
    });
  }

  const user = await userService.store(req.body);
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user,
  });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await userService.findById(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await userService.update(id, req.body);
  res.json({
    success: true,
    message: 'User updated successfully',
    data: updatedUser,
  });
});

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await userService.findById(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await userService.delete(id);

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});
