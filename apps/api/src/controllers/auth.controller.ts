import { Request, Response } from 'express';
import { prisma } from '@/db/prisma-client';
import { authService } from '../services/auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const body = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email đã được sử dụng' });
      }

      // Hash password
      const passwordHash = await authService.hashPassword(body.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
          emailVerified: false,
        },
      });

      const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken },
      });

      res.status(201).json({
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận.',
        userId: user.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('[Auth] Register error:', error);
      res.status(500).json({ error: 'Đăng ký thất bại' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const body = loginSchema.parse(req.body);
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
      }

      // Verify password
      const isValidPassword = await authService.verifyPassword(body.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Get user's organization
      const member = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
        include: { organization: true },
      });

      const organizationId = member?.organizationId;
      const role = member?.role || 'MEMBER';

      // Generate tokens
      const payload = {
        userId: user.id,
        organizationId,
        role,
      };

      const accessToken = authService.generateAccessToken(payload);
      const refreshToken = authService.generateRefreshToken(payload);

      // Create session
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');
      await authService.createSession(user.id, accessToken, refreshToken, ipAddress, userAgent);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
        },
        organization: member?.organization || null,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('[Auth] Login error:', error);
      res.status(500).json({ error: 'Đăng nhập thất bại' });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      
      if (userId) {
        await authService.deleteAllUserSessions(userId);
      }

      res.json({ message: 'Đăng xuất thành công' });
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      res.status(500).json({ error: 'Đăng xuất thất bại' });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Thiếu refresh token' });
      }

      const { accessToken } = await authService.refreshAccessToken(refreshToken);

      res.json({ accessToken });
    } catch (error) {
      console.error('[Auth] Refresh token error:', error);
      res.status(401).json({ error: 'Refresh token không hợp lệ' });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Thiếu token xác nhận' });
      }

      const user = await prisma.user.findFirst({
        where: { verificationToken: token as string },
      });

      if (!user) {
        return res.status(400).json({ error: 'Token không hợp lệ' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
        },
      });

      res.json({ message: 'Email xác nhận thành công' });
    } catch (error) {
      console.error('[Auth] Verify email error:', error);
      res.status(500).json({ error: 'Xác nhận email thất bại' });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Return success even if user doesn't exist (security)
        return res.json({ message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu' });
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires,
        },
      });

      res.json({ message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu' });
    } catch (error) {
      console.error('[Auth] Forgot password error:', error);
      res.status(500).json({ error: 'Gửi email đặt lại mật khẩu thất bại' });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Thiếu token hoặc mật khẩu mới' });
      }

      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { gt: new Date() },
        },
      });

      if (!user) {
        return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
      }

      const passwordHash = await authService.hashPassword(password);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
      console.error('[Auth] Reset password error:', error);
      res.status(500).json({ error: 'Đặt lại mật khẩu thất bại' });
    }
  }
}

export const authController = new AuthController();
