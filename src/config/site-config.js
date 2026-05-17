const SHOP_NAME = import.meta.env.VITE_SHOP_NAME || 'TRỌNG ĐỊNH STORE';
let SHOP_DOMAIN = import.meta.env.VITE_SHOP_DOMAIN || 'trongdinhstore.vn';
// Strip protocol if user accidentally includes it in domain env
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
  description: import.meta.env.VITE_SHOP_DESCRIPTION || `${SHOP_NAME} — Thức ăn chính hãng cho thú cưng, giao nhanh toàn quốc.`
};

export default SITE;
