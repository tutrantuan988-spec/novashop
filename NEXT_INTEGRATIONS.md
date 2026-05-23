# Next Integrations

Firestore is already connected. Add these next, in this order.

## 1. Cloudinary image upload

Use this first so admin can upload product images instead of pasting image URLs.

Provider:

```txt
https://cloudinary.com/
```

Fill:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

You need an unsigned upload preset for frontend direct upload, or keep using the backend upload endpoint with admin auth.

## 2. Resend email

Use this for contact form, order confirmation, payment confirmation, and abandoned cart emails.

Provider:

```txt
https://resend.com/api-keys
```

Fill:

```env
RESEND_API_KEY=
EMAIL_FROM=TRONG DINH STORE <your-verified-domain-email>
ADMIN_NOTIFICATION_EMAIL=
```

For production, verify a domain in Resend before using a custom `EMAIL_FROM`.

## 3. GHN shipping

Use this for shipping fee calculation, shipment creation, and tracking.

Provider:

```txt
https://sso.ghn.vn/
```

Fill:

```env
GHN_API_TOKEN=
GHN_SHOP_ID=
GHN_API_URL=https://online-gateway.ghn.vn/shiip/public-api
```

## 4. Stripe payments

Use this for card checkout.

Provider:

```txt
https://dashboard.stripe.com/apikeys
```

Fill:

```env
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Check status

Run:

```powershell
npm run check:env
```

Or open Admin -> Tong quan -> Trang thai tich hop.
