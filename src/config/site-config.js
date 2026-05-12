const SHOP_NAME = import.meta.env.VITE_SHOP_NAME || 'NovaShop';
let SHOP_DOMAIN = import.meta.env.VITE_SHOP_DOMAIN || 'novashop.vn';
// Strip protocol if user accidentally includes it in domain env
SHOP_DOMAIN = SHOP_DOMAIN.replace(/^https?:\/\//, '');
const SHOP_URL = `https://${SHOP_DOMAIN}`;

const SITE = {
  name: SHOP_NAME,
  domain: SHOP_DOMAIN,
  url: SHOP_URL,
  phone: import.meta.env.VITE_SHOP_PHONE || '1900 1234',
  email: import.meta.env.VITE_SHOP_EMAIL || `support@${SHOP_DOMAIN}`,
  address: import.meta.env.VITE_SHOP_ADDRESS || '123 Nguyễn Huệ, Q.1, TP.HCM',
  facebook: import.meta.env.VITE_SHOP_FACEBOOK || '#',
  instagram: import.meta.env.VITE_SHOP_INSTAGRAM || '#',
  youtube: import.meta.env.VITE_SHOP_YOUTUBE || '#',
  description: import.meta.env.VITE_SHOP_DESCRIPTION || `${SHOP_NAME} - Mua sắm online thông minh với hàng nghìn sản phẩm chính hãng, giao nhanh 24h và chính sách đổi trả linh hoạt.`
};

export default SITE;
