const logger = require('../utils/logger');

/**
 * Multi-tenant service for SaaS functionality
 * Manages tenant isolation, subscription tiers, and RBAC
 */

const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'FREE',
    maxProducts: 10,
    maxOrders: 100,
    features: ['basic_analytics', 'email_support']
  },
  STARTER: {
    name: 'STARTER',
    price: 290000,
    maxProducts: 100,
    maxOrders: 1000,
    features: ['advanced_analytics', 'priority_support', 'custom_domain']
  },
  PROFESSIONAL: {
    name: 'PROFESSIONAL',
    price: 890000,
    maxProducts: 1000,
    maxOrders: 10000,
    features: ['advanced_analytics', 'priority_support', 'custom_domain', 'api_access', 'white_label']
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    price: 2890000,
    maxProducts: -1, // unlimited
    maxOrders: -1, // unlimited
    features: ['advanced_analytics', 'priority_support', 'custom_domain', 'api_access', 'white_label', 'dedicated_support', 'sla']
  }
};

const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [
    'manage_tenant',
    'manage_subscription',
    'manage_users',
    'manage_products',
    'manage_orders',
    'view_analytics',
    'manage_settings'
  ],
  [ROLES.ADMIN]: [
    'manage_products',
    'manage_orders',
    'view_analytics',
    'manage_settings'
  ],
  [ROLES.EDITOR]: [
    'manage_products',
    'manage_orders'
  ],
  [ROLES.VIEWER]: [
    'view_analytics'
  ]
};

async function getTenantById(tenantId, adminDb) {
  if (!adminDb) return null;
  
  try {
    const doc = await adminDb.collection('tenants').doc(tenantId).get();
    if (!doc.exists) return null;
    
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logger.error('[Tenant] Failed to get tenant:', error);
    return null;
  }
}

async function getTenantByDomain(domain, adminDb) {
  if (!adminDb) return null;
  
  try {
    const snap = await adminDb
      .collection('tenants')
      .where('customDomain', '==', domain)
      .limit(1)
      .get();
    
    if (snap.empty) return null;
    
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    logger.error('[Tenant] Failed to get tenant by domain:', error);
    return null;
  }
}

async function createTenant(tenantData, adminDb) {
  if (!adminDb) throw new Error('Database not available');
  
  try {
    const tenantRef = await adminDb.collection('tenants').add({
      ...tenantData,
      subscriptionTier: SUBSCRIPTION_TIERS.FREE.name,
      subscriptionStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    logger.info(`[Tenant] Created tenant: ${tenantRef.id}`);
    return { id: tenantRef.id, ...tenantData };
  } catch (error) {
    logger.error('[Tenant] Failed to create tenant:', error);
    throw error;
  }
}

async function updateTenantSubscription(tenantId, tier, adminDb) {
  if (!adminDb) throw new Error('Database not available');
  
  try {
    const tierConfig = SUBSCRIPTION_TIERS[tier.toUpperCase()];
    if (!tierConfig) throw new Error('Invalid subscription tier');
    
    await adminDb.collection('tenants').doc(tenantId).update({
      subscriptionTier: tierConfig.name,
      subscriptionStatus: 'active',
      subscriptionUpdatedAt: new Date(),
      updatedAt: new Date()
    });
    
    logger.info(`[Tenant] Updated subscription for ${tenantId} to ${tierConfig.name}`);
    return { success: true, tier: tierConfig.name };
  } catch (error) {
    logger.error('[Tenant] Failed to update subscription:', error);
    throw error;
  }
}

function hasPermission(userRole, permission) {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

function checkTenantLimits(tenant, resourceType) {
  if (!tenant) return { allowed: false, reason: 'Tenant not found' };
  
  const tier = SUBSCRIPTION_TIERS[tenant.subscriptionTier] || SUBSCRIPTION_TIERS.FREE;
  
  if (resourceType === 'products') {
    if (tier.maxProducts === -1) return { allowed: true };
    return { allowed: true, remaining: tier.maxProducts - (tenant.productCount || 0) };
  }
  
  if (resourceType === 'orders') {
    if (tier.maxOrders === -1) return { allowed: true };
    return { allowed: true, remaining: tier.maxOrders - (tenant.orderCount || 0) };
  }
  
  return { allowed: true };
}

module.exports = {
  SUBSCRIPTION_TIERS,
  ROLES,
  ROLE_PERMISSIONS,
  getTenantById,
  getTenantByDomain,
  createTenant,
  updateTenantSubscription,
  hasPermission,
  checkTenantLimits
};
