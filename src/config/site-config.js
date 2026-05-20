const SHOP_NAME = import.meta.env.VITE_SHOP_NAME || 'NovaShop';
let SHOP_DOMAIN = import.meta.env.VITE_SHOP_DOMAIN || 'novashop.vn';
SHOP_DOMAIN = SHOP_DOMAIN.replace(/^https?:\/\//, '');
const SHOP_URL = `https://${SHOP_DOMAIN}`;

const SITE = {
  name: SHOP_NAME,
  domain: SHOP_DOMAIN,
  url: SHOP_URL,
  phone: import.meta.env.VITE_SHOP_PHONE || '0369712958',
  email: import.meta.env.VITE_SHOP_EMAIL || 'tutrantuan988@gmail.com',
  address: import.meta.env.VITE_SHOP_ADDRESS || 'Hà Nội, Việt Nam',
  facebook: import.meta.env.VITE_SHOP_FACEBOOK || '#',
  instagram: import.meta.env.VITE_SHOP_INSTAGRAM || '#',
  youtube: import.meta.env.VITE_SHOP_YOUTUBE || '#',
  zalo: import.meta.env.VITE_SHOP_ZALO || '#',
  tiktok: import.meta.env.VITE_SHOP_TIKTOK || '#',
  description: import.meta.env.VITE_SHOP_DESCRIPTION || `${SHOP_NAME} — Nền tảng thương mại đa ngành, mua sắm không giới hạn.`,
  slogan: import.meta.env.VITE_SHOP_SLOGAN || 'Mua sắm không giới hạn'
};

export default SITE;
