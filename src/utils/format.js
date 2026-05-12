export const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
});

export const formatVND = (value) => currency.format(value || 0);
