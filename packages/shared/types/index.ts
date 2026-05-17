export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  subscriptionStatus: 'active' | 'past_due' | 'cancelled' | 'trial';
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface Product {
  id: string;
  organizationId: string;
  categoryId: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface Order {
  id: string;
  organizationId: string;
  userId?: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  total: number;
}
