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

function abandonedCartHtml({ items, reminderLevel, couponCode }) {
  const rows = (items || []).map((it) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">
        ${it.image ? `<img src="${it.image}" style="width:48px;height:48px;border-radius:6px;object-fit:cover;vertical-align:middle;margin-right:8px;" />` : ''}
        ${it.name || ''}
      </td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${it.quantity || 1}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatVND((it.price || 0) * (it.quantity || 1))}</td>
    </tr>
  `).join('');
  const couponBlock = couponCode
    ? `<div style="background:#fff7ed;border:2px dashed #f97316;padding:16px;text-align:center;border-radius:12px;margin:16px 0;">
        <p style="margin:0;font-size:14px;color:#9a3412;">Tặng bạn mã giảm 5% — quay lại ngay!</p>
        <p style="font-size:24px;font-weight:800;color:#f97316;margin:8px 0 0;letter-spacing:2px;">${couponCode}</p>
      </div>`
    : '';
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#14213d;">
      <div style="background:#f97316;color:#fff;padding:24px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="margin:0;font-size:24px;">Bạn quên gì đó tại NovaShop?</h1>
        <p style="margin:8px 0 0;color:#fed7aa;">${reminderLevel === 2 ? 'Chỉ còn vài bước để hoàn tất đơn hàng' : 'Sản phẩm bạn yêu thích đang chờ'}</p>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 16px 16px;">
        <p>Chào bạn,</p>
        <p>Chúng tôi thấy bạn đã thêm sản phẩm vào giỏ nhưng chưa hoàn tất. Đây là những thứ đang chờ bạn:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px;text-align:left;">Sản phẩm</th>
              <th style="padding:10px;text-align:center;">SL</th>
              <th style="padding:10px;text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${couponBlock}
        <div style="text-align:center;margin:20px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/thanh-toan" style="display:inline-block;padding:14px 32px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">
            Hoàn tất đơn hàng
          </a>
        </div>
        <p style="color:#64748b;font-size:13px;">Đây là email tự động — bạn có thể bỏ qua nếu đã mua hàng rồi.</p>
      </div>
    </div>
  `;
}

async function sendAbandonedCartEmail({ email, items, reminderLevel, couponCode }) {
  return sendEmail({
    to: email,
    subject: reminderLevel === 2
      ? '🛒 Tặng bạn mã giảm 5% — quay lại NovaShop ngay!'
      : '🛒 Bạn quên gì đó tại NovaShop',
    html: abandonedCartHtml({ items, reminderLevel, couponCode })
  });
}

async function sendNotificationEmail({ email, subject, title, body, ctaUrl, ctaLabel }) {
  if (!email) return { skipped: true };
  const ctaButton = ctaUrl
    ? `<div style="text-align:center;margin:20px 0;">
         <a href="${ctaUrl}" style="display:inline-block;padding:12px 28px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">${ctaLabel || 'Xem chi tiết'}</a>
       </div>`
    : '';
  return sendEmail({
    to: email,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#14213d;">
        <div style="background:#14213d;color:#fff;padding:24px;border-radius:16px 16px 0 0;">
          <h1 style="margin:0;font-size:22px;">${title}</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 16px 16px;">
          <div style="font-size:15px;line-height:1.6;">${body}</div>
          ${ctaButton}
        </div>
      </div>
    `
  });
}

module.exports = {
  sendOrderCreatedEmails,
  sendOrderPaidEmails,
  sendAbandonedCartEmail,
  sendNotificationEmail
};
