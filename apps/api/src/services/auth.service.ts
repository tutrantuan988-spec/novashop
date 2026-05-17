import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { prisma } from '@/db/prisma-client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(REDIS_URL);

interface TokenPayload {
  userId: string;
  organizationId?: string;
  role?: string;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async createSession(userId: string, token: string, refreshToken: string, ipAddress?: string, userAgent?: string) {
    const sessionKey = `session:${userId}:${token}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await redis.hset(sessionKey, {
      userId,
      token,
      refreshToken,
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    await redis.expire(sessionKey, 15 * 60); // 15 minutes

    return sessionKey;
  }

  async getSession(sessionKey: string) {
    const session = await redis.hgetall(sessionKey);
    if (!session) return null;

    const expiresAt = new Date(session.expiresAt);
    if (expiresAt < new Date()) {
      await redis.del(sessionKey);
      return null;
    }

    return session;
  }

  async deleteSession(sessionKey: string) {
    await redis.del(sessionKey);
  }

  async deleteAllUserSessions(userId: string) {
    const pattern = `session:${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.verifyToken(refreshToken);
      
      // Find session with this refresh token
      const pattern = `session:${payload.userId}:*`;
      const keys = await redis.keys(pattern);
      
      for (const key of keys) {
        const session = await redis.hgetall(key);
        if (session.refreshToken === refreshToken) {
          const newAccessToken = this.generateAccessToken({
            userId: payload.userId,
            organizationId: payload.organizationId,
            role: payload.role,
          });
          
          return { accessToken: newAccessToken };
        }
      }

      throw new Error('Invalid refresh token');
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
  }
}

export const authService = new AuthService();
