/**
 * Simple CSV export (P15). Không cần papaparse.
 */

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * @param {Array<object>} rows
 * @param {Array<{ key: string, label: string, map?: (row: object) => any }>} columns
 * @returns {string} CSV content
 */
export function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escapeCell(c.map ? c.map(row) : row[c.key])).join(',')
  ).join('\n');
  return `${header}\n${body}`;
}

export function downloadCsv(filename, csvContent) {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportOrdersCsv(orders, filename = 'orders.csv') {
  const csv = toCsv(orders, [
    { key: 'id', label: 'Mã đơn' },
    { key: 'createdAt', label: 'Ngày tạo', map: (r) => {
      if (!r.createdAt) return '';
      try {
        const d = r.createdAt._seconds ? new Date(r.createdAt._seconds * 1000) : new Date(r.createdAt);
        return d.toLocaleString('vi-VN');
      } catch { return ''; }
    } },
    { key: 'customer', label: 'Khách', map: (r) => r.customer?.name || '' },
    { key: 'phone', label: 'SĐT', map: (r) => r.customer?.phone || '' },
    { key: 'email', label: 'Email', map: (r) => r.customer?.email || '' },
    { key: 'address', label: 'Địa chỉ', map: (r) => r.customer?.address || '' },
    { key: 'items', label: 'Số SP', map: (r) => (r.items || []).length },
    { key: 'subtotal', label: 'Tạm tính' },
    { key: 'shipping', label: 'Vận chuyển' },
    { key: 'discount', label: 'Giảm giá' },
    { key: 'total', label: 'Tổng' },
    { key: 'status', label: 'Trạng thái' },
    { key: 'paymentMethod', label: 'Thanh toán' },
    { key: 'paymentStatus', label: 'Trạng thái TT' }
  ]);
  downloadCsv(filename, csv);
}
