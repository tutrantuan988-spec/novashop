import { Request, Response } from 'express';
import { prisma } from '@/db/prisma-client';
import { z } from 'zod';

const createOrganizationSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
});

const updateOrganizationSchema = z.object({
  name: z.string().min(2).optional(),
  logo: z.string().url().optional(),
  customDomain: z.string().optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

export class OrganizationController {
  async createOrganization(req: Request, res: Response) {
    try {
      const userId = req.body.userId;
      const body = createOrganizationSchema.parse(req.body);

      // Check if slug exists
      const existing = await prisma.organization.findUnique({
        where: { slug: body.slug },
      });

      if (existing) {
        return res.status(400).json({ error: 'Slug đã được sử dụng' });
      }

      // Create organization
      const organization = await prisma.organization.create({
        data: {
          name: body.name,
          slug: body.slug,
          subscriptionTier: 'FREE',
          subscriptionStatus: 'active',
        },
      });

      // Add user as owner
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: 'OWNER',
        },
      });

      // Create default settings
      await prisma.organizationSettings.create({
        data: {
          organizationId: organization.id,
          themeColor: '#ff7a1a',
          currency: 'VND',
          locale: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
        },
      });

      res.status(201).json(organization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('[Organization] Create error:', error);
      res.status(500).json({ error: 'Tạo tổ chức thất bại' });
    }
  }

  async getOrganizations(req: Request, res: Response) {
    try {
      const userId = req.body.userId;

      const memberships = await prisma.organizationMember.findMany({
        where: { userId },
        include: {
          organization: {
            include: {
              settings: true,
            },
          },
        },
      });

      const organizations = memberships.map((m: any) => ({
        ...m.organization,
        role: m.role,
        joinedAt: m.joinedAt,
      }));

      res.json(organizations);
    } catch (error) {
      console.error('[Organization] Get error:', error);
      res.status(500).json({ error: 'Lấy danh sách tổ chức thất bại' });
    }
  }

  async getOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.body.userId;

      // Check if user is member
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: id,
          userId,
        },
      });

      if (!member) {
        return res.status(403).json({ error: 'Bạn không có quyền truy cập tổ chức này' });
      }

      const organization = await prisma.organization.findUnique({
        where: { id },
        include: {
          settings: true,
          _count: {
            select: {
              users: true,
              products: true,
              orders: true,
            },
          },
        },
      });

      res.json(organization);
    } catch (error) {
      console.error('[Organization] Get by ID error:', error);
      res.status(500).json({ error: 'Lấy thông tin tổ chức thất bại' });
    }
  }

  async updateOrganization(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.body.userId;
      const body = updateOrganizationSchema.parse(req.body);

      // Check if user is owner or admin
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: id,
          userId,
        },
      });

      if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
        return res.status(403).json({ error: 'Bạn không có quyền cập nhật tổ chức này' });
      }

      const organization = await prisma.organization.update({
        where: { id },
        data: body,
      });

      res.json(organization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('[Organization] Update error:', error);
      res.status(500).json({ error: 'Cập nhật tổ chức thất bại' });
    }
  }

  async inviteMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.body.userId;
      const body = inviteMemberSchema.parse(req.body);

      // Check if user is owner
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: id,
          userId,
        },
      });

      if (!member || member.role !== 'OWNER') {
        return res.status(403).json({ error: 'Chỉ Owner mới có thể mời thành viên' });
      }

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'Người dùng không tồn tại' });
      }

      // Check if already member
      const existingMember = await prisma.organizationMember.findFirst({
        where: {
          organizationId: id,
          userId: targetUser.id,
        },
      });

      if (existingMember) {
        return res.status(400).json({ error: 'Người dùng đã là thành viên' });
      }

      // Add member
      await prisma.organizationMember.create({
        data: {
          organizationId: id,
          userId: targetUser.id,
          role: body.role,
        },
      });

      res.json({ message: 'Đã mời thành viên thành công' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('[Organization] Invite error:', error);
      res.status(500).json({ error: 'Mời thành viên thất bại' });
    }
  }

  async getMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.body.userId;

      // Check if user is member
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: id,
          userId,
        },
      });

      if (!member) {
        return res.status(403).json({ error: 'Bạn không có quyền truy cập tổ chức này' });
      }

      const members = await prisma.organizationMember.findMany({
        where: { organizationId: id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      res.json(members);
    } catch (error) {
      console.error('[Organization] Get members error:', error);
      res.status(500).json({ error: 'Lấy danh sách thành viên thất bại' });
    }
  }

  async updateMemberRole(req: Request, res: Response) {
    try {
      const { id, memberId } = req.params;
      const userId = req.body.userId;
      const { role } = req.body;

      // Check if user is owner
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: id,
          userId,
        },
      });

      if (!member || member.role !== 'OWNER') {
        return res.status(403).json({ error: 'Chỉ Owner mới có thể thay đổi vai trò' });
      }

      // Update role
      await prisma.organizationMember.update({
        where: { id: memberId },
        data: { role },
      });

      res.json({ message: 'Đã cập nhật vai trò thành công' });
    } catch (error) {
      console.error('[Organization] Update role error:', error);
      res.status(500).json({ error: 'Cập nhật vai trò thất bại' });
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      const { id, memberId } = req.params;
      const userId = req.body.userId;

      // Check if user is owner
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: id,
          userId,
        },
      });

      if (!member || member.role !== 'OWNER') {
        return res.status(403).json({ error: 'Chỉ Owner mới có thể xóa thành viên' });
      }

      // Remove member
      await prisma.organizationMember.delete({
        where: { id: memberId },
      });

      res.json({ message: 'Đã xóa thành viên thành công' });
    } catch (error) {
      console.error('[Organization] Remove error:', error);
      res.status(500).json({ error: 'Xóa thành viên thất bại' });
    }
  }
}

export const organizationController = new OrganizationController();
