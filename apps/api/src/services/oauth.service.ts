import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/db/prisma-client';
import { authService } from './auth.service';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export class OAuthService {
  async getGoogleAuthUrl() {
    const scopes = [
      'openid',
      'email',
      'profile',
    ];

    const url = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    });

    return url;
  }

  async handleGoogleCallback(code: string) {
    try {
      const { tokens } = await googleClient.getToken(code);
      googleClient.setCredentials(tokens);

      // Get user info from Google
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid Google token');
      }

      const { email, name, picture, sub: googleId } = payload;

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Create new user
        const passwordHash = await authService.hashPassword(Math.random().toString(36));
        
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            avatar: picture,
            passwordHash,
            emailVerified: true,
          },
        });
      } else {
        // Update existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: name || user.name,
            avatar: picture || user.avatar,
            emailVerified: true,
            lastLoginAt: new Date(),
          },
        });
      }

      // Get user's organization
      const member = await prisma.organizationMember.findFirst({
        where: { userId: user.id },
        include: { organization: true },
      });

      const organizationId = member?.organizationId;
      const role = member?.role || 'MEMBER';

      // Generate tokens
      const accessToken = authService.generateAccessToken({
        userId: user.id,
        organizationId,
        role,
      });
      const refreshToken = authService.generateRefreshToken({
        userId: user.id,
        organizationId,
        role,
      });

      // Create session
      await authService.createSession(user.id, accessToken, refreshToken);

      return {
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
      };
    } catch (error: any) {
      console.error('[OAuth] Google callback error:', error);
      throw new Error('Google authentication failed');
    }
  }
}

export const oauthService = new OAuthService();
