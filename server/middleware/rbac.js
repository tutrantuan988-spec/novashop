/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Provides granular permission management for different user roles.
 * Supports hierarchical roles and permission inheritance.
 * 
 * @module server/middleware/rbac
 */

/**
 * Permission definitions
 * Each permission represents a specific action in the system
 */
const PERMISSIONS = {
  // Product permissions
  'products:read': 'View products',
  'products:create': 'Create new products',
  'products:update': 'Update existing products',
  'products:delete': 'Delete products',
  'products:manage': 'Full product management',
  
  // Order permissions
  'orders:read': 'View orders',
  'orders:read:own': 'View own orders only',
  'orders:read:all': 'View all orders',
  'orders:update': 'Update order status',
  'orders:cancel': 'Cancel orders',
  'orders:refund': 'Process refunds',
  
  // User permissions
  'users:read': 'View users',
  'users:create': 'Create users',
  'users:update': 'Update users',
  'users:delete': 'Delete users',
  'users:manage': 'Full user management',
  
  // Coupon permissions
  'coupons:read': 'View coupons',
  'coupons:create': 'Create coupons',
  'coupons:update': 'Update coupons',
  'coupons:delete': 'Delete coupons',
  
  // Review permissions
  'reviews:read': 'View reviews',
  'reviews:create': 'Create reviews',
  'reviews:update': 'Update reviews',
  'reviews:delete': 'Delete reviews',
  'reviews:moderate': 'Moderate reviews',
  
  // Analytics permissions
  'analytics:read': 'View analytics',
  'analytics:export': 'Export analytics data',
  
  // Settings permissions
  'settings:read': 'View settings',
  'settings:update': 'Update settings',
  
  // Admin permissions
  'admin:access': 'Access admin panel',
  'admin:audit': 'View audit logs',
  'admin:system': 'System administration'
};

/**
 * Role definitions with their permissions
 * Roles are hierarchical - higher roles inherit lower role permissions
 */
const ROLES = {
  // Customer role - basic user
  user: {
    name: 'User',
    description: 'Regular customer',
    permissions: [
      'products:read',
      'orders:read:own',
      'orders:cancel', // Can cancel own orders
      'reviews:create',
      'reviews:update' // Can update own reviews
    ]
  },
  
  // Staff role - can manage products and view orders
  staff: {
    name: 'Staff',
    description: 'Store staff member',
    inherits: ['user'],
    permissions: [
      'products:read',
      'products:create',
      'products:update',
      'orders:read:all',
      'orders:update',
      'reviews:read',
      'reviews:moderate',
      'admin:access'
    ]
  },
  
  // Manager role - can manage most resources
  manager: {
    name: 'Manager',
    description: 'Store manager',
    inherits: ['staff'],
    permissions: [
      'products:delete',
      'products:manage',
      'orders:refund',
      'coupons:read',
      'coupons:create',
      'coupons:update',
      'coupons:delete',
      'analytics:read',
      'analytics:export',
      'users:read'
    ]
  },
  
  // Admin role - full access
  admin: {
    name: 'Administrator',
    description: 'System administrator',
    inherits: ['manager'],
    permissions: [
      'users:create',
      'users:update',
      'users:delete',
      'users:manage',
      'settings:read',
      'settings:update',
      'admin:audit',
      'admin:system'
    ]
  },
  
  // Owner role - complete control
  owner: {
    name: 'Owner',
    description: 'Business owner',
    inherits: ['admin'],
    permissions: ['*'] // All permissions
  }
};

/**
 * Get all permissions for a role (including inherited)
 * @param {string} roleName - Role name
 * @returns {string[]} Array of permission strings
 */
function getRolePermissions(roleName) {
  const role = ROLES[roleName];
  if (!role) return [];
  
  let permissions = [...(role.permissions || [])];
  
  // Add inherited permissions
  if (role.inherits && Array.isArray(role.inherits)) {
    for (const inheritedRole of role.inherits) {
      const inheritedPerms = getRolePermissions(inheritedRole);
      permissions = [...permissions, ...inheritedPerms];
    }
  }
  
  // Remove duplicates
  return [...new Set(permissions)];
}

/**
 * Check if a role has a specific permission
 * @param {string} roleName - Role name
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
function hasPermission(roleName, permission) {
  const permissions = getRolePermissions(roleName);
  
  // Check for wildcard permission
  if (permissions.includes('*')) return true;
  
  // Check for exact permission
  if (permissions.includes(permission)) return true;
  
  // Check for wildcard in permission category
  // e.g., 'products:*' matches 'products:read'
  const category = permission.split(':')[0];
  if (permissions.includes(`${category}:*`)) return true;
  
  return false;
}

/**
 * Middleware: Require specific role
 * @param {string|string[]} allowedRoles - Role(s) allowed
 * @returns {Function} Express middleware
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient role',
        code: 'FORBIDDEN',
        required: roles,
        current: userRole
      });
    }
    
    next();
  };
}

/**
 * Middleware: Require specific permission
 * @param {string|string[]} requiredPermissions - Permission(s) required
 * @returns {Function} Express middleware
 */
function requirePermission(requiredPermissions) {
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  return function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userRole = req.user.role || 'user';
    
    // Check if user has any of the required permissions
    const hasAnyPermission = permissions.some(perm => 
      hasPermission(userRole, perm)
    );
    
    if (!hasAnyPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: permissions
      });
    }
    
    // Attach user permissions to request for further checks
    req.user.permissions = getRolePermissions(userRole);
    
    next();
  };
}

/**
 * Middleware: Check resource ownership
 * Allows users to access their own resources even without global permission
 * 
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 * @returns {Function} Express middleware
 */
function requireOwnership(getResourceOwnerId) {
  return async function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    try {
      const ownerId = await getResourceOwnerId(req);
      const userId = req.user.userId || req.user.email;
      
      // Allow if user is the owner
      if (ownerId === userId) {
        return next();
      }
      
      // Allow if user has admin role
      if (req.user.role === 'admin' || req.user.role === 'owner') {
        return next();
      }
      
      return res.status(403).json({ 
        error: 'You can only access your own resources',
        code: 'FORBIDDEN'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Failed to verify ownership',
        code: 'OWNERSHIP_CHECK_FAILED'
      });
    }
  };
}

/**
 * Get role hierarchy level (higher number = more permissions)
 * @param {string} roleName 
 * @returns {number}
 */
function getRoleLevel(roleName) {
  const levels = {
    user: 1,
    staff: 2,
    manager: 3,
    admin: 4,
    owner: 5
  };
  return levels[roleName] || 0;
}

/**
 * Check if role A can manage role B
 * @param {string} roleA 
 * @param {string} roleB 
 * @returns {boolean}
 */
function canManageRole(roleA, roleB) {
  return getRoleLevel(roleA) > getRoleLevel(roleB);
}

module.exports = {
  // Constants
  PERMISSIONS,
  ROLES,
  
  // Permission checks
  getRolePermissions,
  hasPermission,
  
  // Middleware
  requireRole,
  requirePermission,
  requireOwnership,
  
  // Utilities
  getRoleLevel,
  canManageRole
};
