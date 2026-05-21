import { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { generateToken } from '../libs/jwt.js';
import { asyncHandler } from '../utils/async-handler.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const findUser = await userService.findByEmail(req.body.email);
  if (findUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already exists',
    });
  }

  const user = await userService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: user,
    token: generateToken({ id: user.id, role: user.role }),
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.findByEmail(req.body.email);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  const isPasswordValid = await userService.comparePassword(req.body.password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  await userService.updateLastLogin(user.id);

  const { isActive: _isActive, role: _role, lastLoginAt: _lastLoginAt, password: _password, ...safeUser } = user;

  return res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: safeUser,
      token: generateToken({ id: user.id, role: user.role }),
    },
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.findById(req.user!.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const { isActive: _isActive, role: _role, lastLoginAt: _lastLoginAt, ...safeUser } = user;

  return res.json({
    success: true,
    data: safeUser,
  });
});

export const logout = (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: 'Logout successful',
  });
};
