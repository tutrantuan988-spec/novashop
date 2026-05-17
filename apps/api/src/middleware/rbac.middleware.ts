import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  organizationId?: string;
  role?: string;
}

const ROLE_PERMISSIONS = {
  OWNER: [
    'manage_organization',
    'manage_subscription',
    'manage_members',
    'manage_products',
    'manage_orders',
    'manage_customers',
    'manage_webhooks',
    'view_analytics',
    'manage_settings',
  ],
  ADMIN: [
    'manage_products',
    'manage_orders',
    'manage_customers',
    'view_analytics',
    'manage_settings',
  ],
  STAFF: [
    'view_products',
    'manage_products',
    'view_orders',
    'manage_orders',
    'view_customers',
  ],
  MEMBER: [
    'view_products',
    'view_orders',
  ],
  CUSTOMER: [
    'view_products',
    'view_own_orders',
  ],
};

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.role || 'MEMBER';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Bạn không có quyền truy cập',
        requiredRoles: allowedRoles,
        yourRole: userRole,
      });
    }

    next();
  };
}

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.role || 'MEMBER';
    const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Bạn không có quyền thực hiện hành động này',
        requiredPermission: permission,
        yourRole: userRole,
      });
    }

    next();
  };
}

export function requireOrganizationAccess() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const organizationId = req.params.organizationId || req.params.id || req.body?.organizationId;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    if (req.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập tổ chức này' });
    }

    next();
  };
}
