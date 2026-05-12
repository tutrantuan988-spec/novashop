const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || 'NovaShop <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAILS?.split(',')[0] || 'admin@novashop.vn';

function formatVND(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0);
}

function orderItemsHtml(order) {
  return (order.items || []).map((item) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">${item.name}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatVND(item.price * item.quantity)}</td>
    </tr>
  `).join('');
}

function orderEmailHtml(order, title, subtitle) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#14213d;">
      <div style="background:#14213d;color:#fff;padding:24px;border-radius:16px 16px 0 0;">
        <h1 style="margin:0;font-size:24px;">${title}</h1>
        <p style="margin:8px 0 0;color:#dbeafe;">${subtitle}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 16px 16px;">
        <p><strong>Mã đơn:</strong> ${order.id || ''}</p>
        <p><strong>Khách hàng:</strong> ${order.customer?.name || ''}</p>
        <p><strong>Số điện thoại:</strong> ${order.customer?.phone || ''}</p>
        <p><strong>Địa chỉ:</strong> ${order.customer?.address || ''}</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px;text-align:left;">Sản phẩm</th>
              <th style="padding:10px;text-align:center;">SL</th>
              <th style="padding:10px;text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>${orderItemsHtml(order)}</tbody>
        </table>
        <p style="font-size:18px;text-align:right;"><strong>Tổng cộng: ${formatVND(order.total)}</strong></p>
        <p style="color:#64748b;">NovaShop sẽ liên hệ xác nhận và xử lý đơn hàng trong thời gian sớm nhất.</p>
      </div>
    </div>
  `;
}

async function sendEmail({ to, subject, html }) {
  if (!resend || !to) return { skipped: true };
  try {
    return await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch (error) {
    console.error('[Email] Send failed:', error.message);
    return { error: error.message };
  }
}

async function sendOrderCreatedEmails(order) {
  await Promise.all([
    sendEmail({
      to: order.customer?.email,
      subject: `NovaShop đã nhận đơn hàng ${order.id}`,
      html: orderEmailHtml(order, 'NovaShop đã nhận đơn hàng', 'Cảm ơn bạn đã mua sắm tại NovaShop.')
    }),
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `Đơn hàng mới ${order.id}`,
      html: orderEmailHtml(order, 'Đơn hàng mới', 'Có đơn hàng mới cần xử lý trong admin.')
    })
  ]);
}

async function sendOrderPaidEmails(order) {
  await Promise.all([
    sendEmail({
      to: order.customer?.email,
      subject: `Thanh toán thành công đơn ${order.id}`,
      html: orderEmailHtml(order, 'Thanh toán thành công', 'Đơn hàng của bạn đã được thanh toán và đang chờ xử lý.')
    }),
    sendEmail({
      to: ADMIN_EMAIL,
      subject: `Đơn đã thanh toán ${order.id}`,
      html: orderEmailHtml(order, 'Đơn đã thanh toán', 'Khách hàng đã thanh toán thành công qua Stripe.')
    })
  ]);
}

module.exports = { sendOrderCreatedEmails, sendOrderPaidEmails };
