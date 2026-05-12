const crypto = require('crypto');

// =========================
// VNPay
// =========================
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      sorted[key] = obj[key];
    }
  }
  return sorted;
}

function buildQuery(params) {
  return Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
}

function pad(num, size) {
  return String(num).padStart(size, '0');
}

function vnpayDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1, 2);
  const dd = pad(date.getDate(), 2);
  const hh = pad(date.getHours(), 2);
  const mi = pad(date.getMinutes(), 2);
  const ss = pad(date.getSeconds(), 2);
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

function isVnpayConfigured() {
  return !!(process.env.VNP_TMN_CODE && process.env.VNP_HASH_SECRET);
}

function buildVnpayUrl({ orderId, amount, ipAddr, returnUrl, orderInfo, locale = 'vn' }) {
  if (!isVnpayConfigured()) throw new Error('VNPay chưa được cấu hình');
  const tmnCode = process.env.VNP_TMN_CODE;
  const secretKey = process.env.VNP_HASH_SECRET;
  const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

  const params = sortObject({
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Amount: Math.round(Number(amount) * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: String(orderId),
    vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
    vnp_OrderType: 'other',
    vnp_Locale: locale,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: vnpayDate()
  });

  const signData = buildQuery(params);
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  return `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
}

function verifyVnpayReturn(query) {
  if (!isVnpayConfigured()) return { ok: false, reason: 'not-configured' };
  const secretKey = process.env.VNP_HASH_SECRET;
  const params = { ...query };
  const secureHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted = sortObject(params);
  const signData = buildQuery(sorted);
  const hmac = crypto.createHmac('sha512', secretKey);
  const checkSum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return {
    ok: checkSum === secureHash,
    success: query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00',
    orderId: query.vnp_TxnRef,
    amount: Number(query.vnp_Amount) / 100,
    transactionNo: query.vnp_TransactionNo,
    bankCode: query.vnp_BankCode
  };
}

// =========================
// MoMo
// =========================
function isMomoConfigured() {
  return !!(process.env.MOMO_PARTNER_CODE && process.env.MOMO_ACCESS_KEY && process.env.MOMO_SECRET_KEY);
}

async function createMomoPayment({ orderId, amount, returnUrl, ipnUrl, orderInfo }) {
  if (!isMomoConfigured()) throw new Error('MoMo chưa được cấu hình');
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const endpoint = process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create';
  const requestType = 'captureWallet';
  const requestId = `${orderId}-${Date.now()}`;
  const extraData = '';

  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${Math.round(Number(amount))}`,
    `extraData=${extraData}`,
    `ipnUrl=${ipnUrl}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${partnerCode}`,
    `redirectUrl=${returnUrl}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`
  ].join('&');

  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  const body = {
    partnerCode,
    accessKey,
    requestId,
    amount: String(Math.round(Number(amount))),
    orderId: String(orderId),
    orderInfo,
    redirectUrl: returnUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: 'vi'
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!data.payUrl) {
    throw new Error(data.message || 'Không tạo được phiên MoMo');
  }
  return { payUrl: data.payUrl, requestId, deeplink: data.deeplink, qrCodeUrl: data.qrCodeUrl };
}

function verifyMomoIpn(body) {
  if (!isMomoConfigured()) return { ok: false };
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const fields = [
    `accessKey=${accessKey}`,
    `amount=${body.amount}`,
    `extraData=${body.extraData || ''}`,
    `message=${body.message}`,
    `orderId=${body.orderId}`,
    `orderInfo=${body.orderInfo}`,
    `orderType=${body.orderType}`,
    `partnerCode=${body.partnerCode}`,
    `payType=${body.payType}`,
    `requestId=${body.requestId}`,
    `responseTime=${body.responseTime}`,
    `resultCode=${body.resultCode}`,
    `transId=${body.transId}`
  ].join('&');
  const expected = crypto.createHmac('sha256', secretKey).update(fields).digest('hex');
  return {
    ok: expected === body.signature,
    success: Number(body.resultCode) === 0,
    orderId: body.orderId,
    transId: body.transId,
    amount: Number(body.amount)
  };
}

module.exports = {
  isVnpayConfigured,
  buildVnpayUrl,
  verifyVnpayReturn,
  isMomoConfigured,
  createMomoPayment,
  verifyMomoIpn
};
